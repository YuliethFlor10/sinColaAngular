import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  constructor() {}

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

    // Simular carga de datos
    setTimeout(() => {
      this.loadReportData();
    }, 1500);
  }

  private loadReportData() {
    try {
      const data = this.sampleData[this.selectedPerson] || [];
      
      if (data.length === 0) {
        this.noDataMessage = 'No hay datos disponibles para el período y personal seleccionado.';
        this.isGenerating = false;
        return;
      }

      // Procesar datos para el resumen
      this.mostPerformedServices = data
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({ name: item.name, count: item.count }));

      this.totalValue = data.reduce((sum, item) => sum + item.value, 0);

      // Crear el gráfico
      this.createChart(data);
      
      this.showChart = true;
      this.isGenerating = false;
      
      this.showSuccessMessage('Informe generado exitosamente.');
      
    } catch (error) {
      console.error('Error al generar el informe:', error);
      this.showErrorMessage('Error al generar el informe. Por favor, inténtalo de nuevo.');
      this.isGenerating = false;
    }
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
    const names: { [key: string]: string } = {
      empresa: 'Empresa',
      yulieth: 'Yulieth',
      juanito: 'Juanito',
      pablito: 'Pablito'
    };
    
    return names[this.selectedPerson] || 'Seleccionado';
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