import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ReportsService } from '../../../services/reports.service';

// Importar Chart.js
declare var Chart: any;

interface ServiceData {
  name: string;
  count: number;
  value: number;
}

interface MostPerformedService {
  name: string;
  count: number;
}

@Component({
  selector: 'app-informe',
  templateUrl: './informe.component.html',
  styleUrls: ['./informe.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    HttpClientModule,
    AdminWeb, 
    ContenidoComponent
  ]
})
export class InformeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('servicesChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Variables del formulario
  startDate: string = '';
  endDate: string = '';
  // Ahora guardamos el id del usuario seleccionado
  selectedUserId: number | null = null;
  users: Array<any> = [];
  isGenerating: boolean = false;
  showChart: boolean = false;
  
  // Variables del resumen
  mostPerformedServices: MostPerformedService[] = [];
  totalValue: number = 0;
  // Estadísticas solicitadas
  totalRecords: number = 0;
  averagePerMonth: number = 0;
  bestMonthLabel: string = '';
  
  // Mensajes de estado
  successMessage: string = '';
  errorMessage: string = '';
  infoMessage: string = '';
  noDataMessage: string = 'Selecciona un rango de fechas y personal para generar el informe.';
  
  // Chart.js instance
  chartInstance: any = null;
  
  // Datos de ejemplo para la simulación
  private sampleData: { [key: string]: ServiceData[] } = {
    empresa: [
      { name: 'Consulta General', count: 45, value: 2250000 },
      { name: 'Especialista', count: 32, value: 2560000 },
      { name: 'Procedimiento', count: 18, value: 2160000 },
      { name: 'Control', count: 25, value: 1250000 },
      { name: 'Urgencias', count: 12, value: 1800000 }
    ],
    yulieth: [
      { name: 'Consulta General', count: 20, value: 1000000 },
      { name: 'Especialista', count: 15, value: 1200000 },
      { name: 'Control', count: 10, value: 500000 },
      { name: 'Procedimiento', count: 8, value: 960000 }
    ],
    juanito: [
      { name: 'Especialista', count: 12, value: 960000 },
      { name: 'Procedimiento', count: 8, value: 960000 },
      { name: 'Consulta General', count: 15, value: 750000 },
      { name: 'Control', count: 6, value: 300000 }
    ],
    pablito: [
      { name: 'Control', count: 18, value: 900000 },
      { name: 'Consulta General', count: 10, value: 500000 },
      { name: 'Especialista', count: 7, value: 560000 },
      { name: 'Procedimiento', count: 4, value: 480000 }
    ]
  };

  constructor(private reportsService: ReportsService) {}

  ngOnInit() {
    this.initializeDates();
    // Cargar usuarios disponibles desde la API
    this.loadUsers();
  }

  ngAfterViewInit() {
    // El canvas está disponible aquí
  }

  private initializeDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(today);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onDateChange() {
    // Validar que la fecha de inicio no sea mayor que la de fin
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      if (start > end) {
        this.showErrorMessage('La fecha de inicio no puede ser mayor que la fecha de fin.');
        return;
      }
      
      // Limpiar mensaje si las fechas son válidas
      this.clearMessages();
    }
  }

  onPersonChange() {
    // Si hay datos mostrados, regenerar automáticamente
    if (this.showChart) {
      this.generateReport();
    }
  }

  generateReport() {
    // Validaciones
    if (!this.startDate || !this.endDate) {
      this.showErrorMessage('Por favor, selecciona tanto la fecha de inicio como la de fin.');
      return;
    }

    if (!this.selectedUserId) {
      this.showErrorMessage('Por favor, selecciona un usuario para el informe.');
      return;
    }

    this.isGenerating = true;
    this.clearMessages();
    this.showChart = false;

    // Llamar a la API para generar el informe
    this.isGenerating = true;
    this.clearMessages();
    this.showChart = false;

    this.reportsService.generateReport(this.selectedUserId, this.startDate, this.endDate)
      .subscribe({
        next: (res) => {
          this.processReportResponse(res);
          this.isGenerating = false;
          this.showSuccessMessage('Informe generado exitosamente.');
          this.showChart = true;
        },
        error: (err) => {
          console.error('Error generating report', err);
          this.showErrorMessage(err?.message || 'Error al generar el informe.');
          this.isGenerating = false;
        }
      });
  }

  private processReportResponse(response: any) {
    // La respuesta puede tener distintas formas. Intentamos normalizar a ServiceData[] para el gráfico.
    let services: ServiceData[] = [];

    if (!response) {
      this.noDataMessage = 'No hay datos disponibles para el período y usuario seleccionado.';
      return;
    }

    if (Array.isArray(response.services)) {
      services = response.services;
    } else if (Array.isArray(response.data)) {
      services = response.data;
    } else if (Array.isArray(response)) {
      services = response as ServiceData[];
    }

    // Si no hay servicios, mantener mensaje
    if (!services || services.length === 0) {
      // como fallback, intentar usar sampleData si el usuario tiene un username coincidente
      this.noDataMessage = 'No hay datos disponibles para el período y usuario seleccionado.';
      this.mostPerformedServices = [];
      this.totalValue = 0;
      this.totalRecords = 0;
      this.averagePerMonth = 0;
      this.bestMonthLabel = '';
      return;
    }

    // Procesar datos para el resumen
    this.mostPerformedServices = services
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ name: item.name, count: item.count }));

    this.totalValue = services.reduce((sum, item) => sum + (item.value || 0), 0);

    // Construir datos por mes si vienen en la respuesta
    this.computeStatisticsFromResponse(response, services);

    // Crear el gráfico con los servicios
    this.createChart(services);
  }

  private computeStatisticsFromResponse(response: any, services: ServiceData[]) {
    // Inicializar
    this.totalRecords = 0;
    this.averagePerMonth = 0;
    this.bestMonthLabel = '';

    // Intentar obtener un mapa mensual directamente
    const monthlyMap = new Map<string, number>();

    if (response.monthly && typeof response.monthly === 'object') {
      // response.monthly esperado como { '2025-01': 12, '2025-02': 20 }
      Object.keys(response.monthly).forEach(k => {
        monthlyMap.set(k, Number(response.monthly[k] || 0));
      });
    } else if (Array.isArray(response.records)) {
      // response.records: [{ date: '2025-01-15', count: 3 }, ...]
      response.records.forEach((r: any) => {
        const date = new Date(r.date);
        if (isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + (Number(r.count) || 1));
      });
    } else if (Array.isArray(response.activities)) {
      // response.activities as array of dates
      response.activities.forEach((d: any) => {
        const date = new Date(d);
        if (isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      });
    }

    // Si no hay monthlyMap, intentar derivarlo de services counts usando el rango de meses
    if (monthlyMap.size === 0) {
      // Usaremos la suma de service.count como total de registros
      const total = services.reduce((s, it) => s + (it.count || 0), 0);
      this.totalRecords = total;
      const months = this.monthsBetween(this.startDate, this.endDate);
      this.averagePerMonth = months > 0 ? +(total / months).toFixed(2) : total;
      this.bestMonthLabel = 'No disponible';
      return;
    }

    // Calcular totales y promedio
    let maxMonth = '';
    let maxCount = -1;
    let sum = 0;
    monthlyMap.forEach((count, month) => {
      sum += count;
      if (count > maxCount) {
        maxCount = count;
        maxMonth = month;
      }
    });

    this.totalRecords = sum;
    const monthsSpan = monthlyMap.size || this.monthsBetween(this.startDate, this.endDate) || 1;
    this.averagePerMonth = +(this.totalRecords / monthsSpan).toFixed(2);

    // Formatear mejor mes para mostrar (ej: '2025-02' -> 'Feb 2025')
    this.bestMonthLabel = maxMonth ? this.formatMonthLabel(maxMonth) : '';
  }

  private monthsBetween(start: string, end: string) {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
      return months > 0 ? months : 0;
    } catch {
      return 0;
    }
  }

  private formatMonthLabel(monthKey: string) {
    // monthKey expected as 'YYYY-MM'
    const parts = monthKey.split('-');
    if (parts.length < 2) return monthKey;
    const year = parts[0];
    const month = Number(parts[1]);
    const date = new Date(Number(year), month - 1, 1);
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  private loadUsers() {
    this.reportsService.getUsers().subscribe({
      next: (res) => {
        // Se intenta leer distintas formas de respuesta
        const list = res?.data || res?.users || res || [];
        this.users = Array.isArray(list) ? list : [];
        if (this.users.length > 0) {
          // seleccionar el primero por defecto si no hay selección
          this.selectedUserId = this.selectedUserId || this.users[0].id || null;
        }
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.showInfoMessage('No se pudieron cargar los usuarios. Usar selección manual.');
      }
    });
  }

  private createChart(data: ServiceData[]) {
    // Esperar a que el canvas esté disponible
    setTimeout(() => {
      if (this.chartCanvas?.nativeElement) {
        // Destruir gráfico anterior si existe
        if (this.chartInstance) {
          this.chartInstance.destroy();
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        
        if (ctx) {
          this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: data.map(item => item.name),
              datasets: [{
                data: data.map(item => item.count),
                backgroundColor: [
                  '#FDC030',
                  '#1976d2',
                  '#10b981',
                  '#ef4444',
                  '#8b5cf6',
                  '#f97316',
                  '#06b6d4'
                ],
                borderColor: '#fff',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                      size: 12
                    }
                  }
                },
                title: {
                  display: true,
                  text: `Servicios realizados - ${this.getPersonDisplayName()}`,
                  font: {
                    size: 16,
                    weight: 'bold'
                  },
                  padding: {
                    bottom: 20
                  }
                }
              },
              layout: {
                padding: 10
              }
            }
          });
        }
      }
    }, 100);
  }

  private getPersonDisplayName(): string {
    // Si tenemos la lista de usuarios, buscar el nombre por id
    if (this.users && this.selectedUserId != null) {
      const u = this.users.find(x => x.id === this.selectedUserId);
      if (u) return u.name || u.full_name || u.username || 'Seleccionado';
    }

    return 'Seleccionado';
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    this.clearOtherMessages('success');
    
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.clearOtherMessages('error');
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  private showInfoMessage(message: string) {
    this.infoMessage = message;
    this.clearOtherMessages('info');
    
    setTimeout(() => {
      this.infoMessage = '';
    }, 5000);
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.infoMessage = '';
  }

  private clearOtherMessages(except: 'success' | 'error' | 'info') {
    if (except !== 'success') this.successMessage = '';
    if (except !== 'error') this.errorMessage = '';
    if (except !== 'info') this.infoMessage = '';
  }

  ngOnDestroy() {
    // Limpiar el gráfico al destruir el componente
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}