import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

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

interface ApiReportResponse {
  success: boolean;
  data: {
    services: ServiceData[];
    mostPerformed: MostPerformedService[];
    totalValue: number;
    summary: {
      totalServices: number;
      dateRange: string;
      person: string;
    };
  };
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: any;
}

@Component({
  selector: 'app-informe',
  templateUrl: './informe.component.html',
  styleUrls: ['./informe.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    AdminWeb, 
    ContenidoComponent
  ]
})
export class InformeComponent implements OnInit, AfterViewInit {
  @ViewChild('servicesChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Variables del formulario
  startDate: string = '';
  endDate: string = '';
  selectedPerson: string = 'empresa';
  isGenerating: boolean = false;
  showChart: boolean = false;
  
  // Variables del resumen
  mostPerformedServices: MostPerformedService[] = [];
  totalValue: number = 0;
  
  // Mensajes de estado
  successMessage: string = '';
  errorMessage: string = '';
  infoMessage: string = '';
  noDataMessage: string = 'Selecciona un rango de fechas y personal para generar el informe.';
  
  // Chart.js instance
  chartInstance: any = null;
  
  // URL base de la API - ajusta según tu configuración
  private readonly API_BASE_URL = 'http://localhost:3000/api'; // Cambia por tu URL
  
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeDates();
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

    if (!this.selectedPerson) {
      this.showErrorMessage('Por favor, selecciona el tipo de informe.');
      return;
    }

    this.isGenerating = true;
    this.clearMessages();
    this.showChart = false;

    // Llamar a la API
    this.loadReportDataFromAPI();
  }

  private loadReportDataFromAPI() {
    // Preparar parámetros para la API
    let params = new HttpParams()
      .set('startDate', this.startDate)
      .set('endDate', this.endDate)
      .set('person', this.selectedPerson);

    // Hacer la llamada a la API
    this.http.get<ApiReportResponse>(`${this.API_BASE_URL}/reports/services`, { params })
      .subscribe({
        next: (response) => {
          this.handleApiSuccess(response);
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
  }

  private handleApiSuccess(response: ApiReportResponse) {
    try {
      if (response.success && response.data) {
        const { services, mostPerformed, totalValue } = response.data;
        
        if (!services || services.length === 0) {
          this.noDataMessage = 'No hay datos disponibles para el período y personal seleccionado.';
          this.isGenerating = false;
          return;
        }

        // Procesar datos para el resumen
        this.mostPerformedServices = mostPerformed || 
          services
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(item => ({ name: item.name, count: item.count }));

        this.totalValue = totalValue || services.reduce((sum, item) => sum + item.value, 0);

        // Crear el gráfico
        this.createChart(services);
        
        this.showChart = true;
        this.isGenerating = false;
        
        this.showSuccessMessage(response.message || 'Informe generado exitosamente.');
        
      } else {
        throw new Error(response.message || 'Respuesta inválida de la API');
      }
    } catch (error) {
      console.error('Error al procesar respuesta de la API:', error);
      this.handleApiError(error);
    }
  }

  private handleApiError(error: any) {
    console.error('Error al generar el informe:', error);
    
    this.isGenerating = false;
    this.showChart = false;
    
    let errorMessage = 'Error al generar el informe. Por favor, inténtalo de nuevo.';
    
    // Manejar diferentes tipos de errores
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos de entrada inválidos. Verifica las fechas y selección.';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para generar este informe.';
          break;
        case 404:
          errorMessage = 'Servicio no encontrado. Contacta al administrador.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        default:
          errorMessage = `Error del servidor (${error.status}). Inténtalo de nuevo.`;
      }
    }
    
    this.showErrorMessage(errorMessage);
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
                  '#06b6d4',
                  '#ec4899',
                  '#14b8a6'
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
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const service = data[context.dataIndex];
                      const percentage = ((service.count / data.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1);
                      return `${service.name}: ${service.count} servicios (${percentage}%)`;
                    }
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
    const names: { [key: string]: string } = {
      empresa: 'Empresa',
      yulieth: 'Yulieth',
      juanito: 'Juanito',
      pablito: 'Pablito'
    };
    
    return names[this.selectedPerson] || 'Seleccionado';
  }

  // Método adicional para refrescar datos
  refreshReport() {
    if (this.showChart) {
      this.generateReport();
    }
  }

  // Método para exportar datos (opcional)
  exportReportData() {
    if (!this.showChart) {
      this.showInfoMessage('Primero genera un informe para exportar los datos.');
      return;
    }

    const params = new HttpParams()
      .set('startDate', this.startDate)
      .set('endDate', this.endDate)
      .set('person', this.selectedPerson)
      .set('format', 'excel'); // o 'pdf'

    this.http.get(`${this.API_BASE_URL}/reports/services/export`, { 
      params,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `informe_servicios_${this.selectedPerson}_${this.startDate}_${this.endDate}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccessMessage('Informe exportado exitosamente.');
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.showErrorMessage('Error al exportar el informe.');
      }
    });
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