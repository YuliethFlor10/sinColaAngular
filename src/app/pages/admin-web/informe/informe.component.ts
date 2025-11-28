import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ReportsService } from '../../../services/reports.service';

declare var Chart: any;

interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

interface ServiceData {
  name: string;
  count: number;
  value: number;
  user_id?: number;
  user_name?: string;
}

interface AppointmentData {
  user_id: number;
  user_name: string;
  role: string;
  pending_count: number;
  completed_count: number;
  total_value: number;
  services: ServiceData[];
}

@Component({
  selector: 'app-informe',
  templateUrl: './informe.component.html',
  styleUrls: ['./informe.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AdminWeb, 
    ContenidoComponent
  ]
})
export class InformeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('servicesChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timelineChart') timelineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usersChart') usersCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('appointmentsChart') appointmentsCanvas!: ElementRef<HTMLCanvasElement>;

  // Filtros
  startDate: string = '';
  endDate: string = '';
  selectedUserId: number | null = null;
  selectedPeriod: string = 'month';
  selectedRole: string = 'all';
  selectedStatus: string = 'all';

  // Datos
  users: Array<any> = [];
  filteredUsers: Array<any> = [];
  
  // Estados
  isGenerating: boolean = false;
  showChart: boolean = false;
  
  // Estadísticas principales
  mostPerformedServices: ServiceData[] = [];
  totalValue: number = 0;
  totalRecords: number = 0;
  totalPending: number = 0;
  totalCompleted: number = 0;
  averagePerMonth: number = 0;
  
  // Estadísticas por rol
  propietarioStats = {
    totalServices: 0,
    totalValue: 0,
    services: [] as ServiceData[]
  };
  
  empleadoStats = {
    pendingAppointments: 0,
    completedAppointments: 0,
    totalValue: 0,
    topReserver: '',
    reservations: [] as AppointmentData[]
  };
  
  administradorStats = {
    pendingAppointments: 0,
    completedAppointments: 0,
    totalValue: 0,
    topReserver: '',
    reservations: [] as AppointmentData[]
  };
  
  // Performance de usuarios
  userPerformance: AppointmentData[] = [];
  
  // Mensajes
  successMessage: string = '';
  errorMessage: string = '';
  infoMessage: string = '';
  noDataMessage: string = 'Selecciona los filtros y genera el informe';
  
  // Gráficas
  chartInstance: any = null;
  timelineChartInstance: any = null;
  usersChartInstance: any = null;
  appointmentsChartInstance: any = null;
  mainChartType: 'doughnut' | 'bar' | 'pie' = 'doughnut';

  Math = Math;

  constructor(
    private reportsService: ReportsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeDates();
    this.loadUsers();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    if (this.timelineChartInstance) {
      this.timelineChartInstance.destroy();
      this.timelineChartInstance = null;
    }
    if (this.usersChartInstance) {
      this.usersChartInstance.destroy();
      this.usersChartInstance = null;
    }
    if (this.appointmentsChartInstance) {
      this.appointmentsChartInstance.destroy();
      this.appointmentsChartInstance = null;
    }
  }

  private initializeDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(today);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadUsers(): void {
    this.reportsService.getUsers().subscribe({
      next: (response: ApiResponse<User[]>) => {
        if (response.success) {
          this.users = response.data;
          this.filterUsersByRole();
          console.log('✅ Usuarios cargados:', this.users.length);
        } else {
          this.users = [];
          this.showErrorMessage(response.message || 'Error al obtener los usuarios.');
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar usuarios:', error);
        this.showErrorMessage('Error de conexión al cargar usuarios.');
        this.users = [];
      }
    });
  }

  onRoleChange(): void {
    this.filterUsersByRole();
    this.selectedUserId = null;
    if (this.showChart) {
      this.generateReport();
    }
  }

  filterUsersByRole(): void {
    if (this.selectedRole === 'all') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(u => 
        u.role?.toLowerCase() === this.selectedRole.toLowerCase()
      );
    }
  }

  onPeriodChange(): void {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (this.selectedPeriod) {
      case 'today':
        start = today;
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last-month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    this.startDate = this.formatDate(start);
    this.endDate = this.formatDate(end);
    
    if (this.showChart) {
      this.generateReport();
    }
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      if (start > end) {
        this.showErrorMessage('La fecha de inicio no puede ser mayor que la fecha de fin.');
        return;
      }
      this.clearMessages();
    }
  }

  onPersonChange(): void {
    if (this.showChart) {
      this.generateReport();
    }
  }

  onStatusChange(): void {
    if (this.showChart) {
      this.generateReport();
    }
  }

  // 🔥 MÉTODO CORREGIDO: Enviar TODOS los parámetros al servicio
  generateReport(): void {
    if (!this.startDate || !this.endDate) {
      this.showErrorMessage('Por favor, selecciona tanto la fecha de inicio como la de fin.');
      return;
    }

    this.isGenerating = true;
    this.clearMessages();
    this.showChart = false;

    console.log('📊 Generando informe con filtros:', {
      userId: this.selectedUserId,
      role: this.selectedRole,
      status: this.selectedStatus,
      dates: [this.startDate, this.endDate]
    });

    // 🔥 CRÍTICO: Pasar TODOS los parámetros al servicio
    this.reportsService.generateReport(
      this.selectedUserId,
      this.startDate,
      this.endDate,
      this.selectedRole,    // 🔥 Agregar rol
      this.selectedStatus   // 🔥 Agregar estado
    ).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta del backend:', res);
        this.processReportResponse(res);
        this.isGenerating = false;
        this.showSuccessMessage('Informe generado exitosamente.');
        this.showChart = true;
      },
      error: (err: any) => {
        console.error('❌ Error generating report:', err);
        this.showErrorMessage(err?.message || 'Error al generar el informe. Verifica tu conexión y autenticación.');
        this.isGenerating = false;
        
        // 🔥 COMENTAR EN PRODUCCIÓN
        // this.loadMockData();
        // this.showChart = true;
      }
    });
  }

  private loadMockData(): void {
    const mockResponse = {
      services: [
        { name: 'Corte de Cabello', count: 45, value: 675000, user_id: 1, user_name: 'Juan Pérez' },
        { name: 'Manicure', count: 38, value: 570000, user_id: 2, user_name: 'María López' },
        { name: 'Pedicure', count: 32, value: 640000, user_id: 1, user_name: 'Juan Pérez' },
        { name: 'Tinte de Cabello', count: 28, value: 1120000, user_id: 3, user_name: 'Carlos Gómez' },
        { name: 'Masaje Relajante', count: 25, value: 1250000, user_id: 2, user_name: 'María López' }
      ],
      appointments: [
        { user_id: 1, user_name: 'Juan Pérez', role: 'Empleado', pending_count: 12, completed_count: 45, total_value: 1350000, services: [] },
        { user_id: 2, user_name: 'María López', role: 'Empleado', pending_count: 8, completed_count: 38, total_value: 1140000, services: [] },
        { user_id: 3, user_name: 'Carlos Gómez', role: 'Administrador', pending_count: 5, completed_count: 28, total_value: 1120000, services: [] }
      ],
      monthly: {
        '2024-01': 45,
        '2024-02': 52,
        '2024-03': 48,
        '2024-04': 60,
        '2024-05': 55
      }
    };
    
    this.processReportResponse(mockResponse);
    this.showInfoMessage('Mostrando datos de ejemplo (modo desarrollo)');
  }

  private processReportResponse(response: any): void {
    if (!response) {
      this.noDataMessage = 'No hay datos disponibles para el período y usuario seleccionado.';
      this.resetStats();
      return;
    }

    this.resetStats();

    if (response.services && Array.isArray(response.services)) {
      this.processServicesData(response.services);
    }

    if (response.appointments && Array.isArray(response.appointments)) {
      this.processAppointmentsData(response.appointments);
    }

    if (response.monthly) {
      this.processTimelineData(response.monthly);
    }

    this.createAllCharts(response);
  }

  private processServicesData(services: ServiceData[]): void {
    this.mostPerformedServices = services
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.totalValue = services.reduce((sum, item) => sum + (item.value || 0), 0);
    this.totalRecords = services.reduce((sum, item) => sum + item.count, 0);

    this.propietarioStats.totalServices = this.totalRecords;
    this.propietarioStats.totalValue = this.totalValue;
    this.propietarioStats.services = this.mostPerformedServices;
  }

  private processAppointmentsData(appointments: AppointmentData[]): void {
    this.userPerformance = appointments;

    this.totalPending = appointments.reduce((sum, a) => sum + (a.pending_count || 0), 0);
    this.totalCompleted = appointments.reduce((sum, a) => sum + (a.completed_count || 0), 0);
    this.totalValue += appointments.reduce((sum, a) => sum + (a.total_value || 0), 0);

    const empleados = appointments.filter(a => a.role?.toLowerCase() === 'empleado');
    const administradores = appointments.filter(a => a.role?.toLowerCase() === 'administrador');

    if (empleados.length > 0) {
      this.empleadoStats.pendingAppointments = empleados.reduce((sum, e) => sum + e.pending_count, 0);
      this.empleadoStats.completedAppointments = empleados.reduce((sum, e) => sum + e.completed_count, 0);
      this.empleadoStats.totalValue = empleados.reduce((sum, e) => sum + e.total_value, 0);
      this.empleadoStats.reservations = empleados.sort((a, b) => b.completed_count - a.completed_count);
      this.empleadoStats.topReserver = empleados[0]?.user_name || 'N/A';
    }

    if (administradores.length > 0) {
      this.administradorStats.pendingAppointments = administradores.reduce((sum, a) => sum + a.pending_count, 0);
      this.administradorStats.completedAppointments = administradores.reduce((sum, a) => sum + a.completed_count, 0);
      this.administradorStats.totalValue = administradores.reduce((sum, a) => sum + a.total_value, 0);
      this.administradorStats.reservations = administradores.sort((a, b) => b.completed_count - a.completed_count);
      this.administradorStats.topReserver = administradores[0]?.user_name || 'N/A';
    }
  }

  private processTimelineData(monthly: any): void {
    const monthlyMap = new Map<string, number>();
    
    if (monthly && typeof monthly === 'object') {
      Object.keys(monthly).forEach(k => {
        monthlyMap.set(k, Number(monthly[k] || 0));
      });
    }

    if (monthlyMap.size > 0) {
      const monthsSpan = monthlyMap.size || 1;
      this.averagePerMonth = +(this.totalRecords / monthsSpan).toFixed(2);
    }
  }

  private resetStats(): void {
    this.mostPerformedServices = [];
    this.totalValue = 0;
    this.totalRecords = 0;
    this.totalPending = 0;
    this.totalCompleted = 0;
    this.averagePerMonth = 0;
    this.userPerformance = [];
    
    this.propietarioStats = { totalServices: 0, totalValue: 0, services: [] };
    this.empleadoStats = { pendingAppointments: 0, completedAppointments: 0, totalValue: 0, topReserver: '', reservations: [] };
    this.administradorStats = { pendingAppointments: 0, completedAppointments: 0, totalValue: 0, topReserver: '', reservations: [] };
  }

  private createAllCharts(response: any): void {
    setTimeout(() => {
      if (this.selectedRole === 'propietario' || this.selectedRole === 'all') {
        this.createMainChart(this.mostPerformedServices);
      }
      
      if (this.selectedRole === 'empleado' || this.selectedRole === 'administrador' || this.selectedRole === 'all') {
        this.createAppointmentsChart();
      }
      
      this.createTimelineChart(response);
      this.createUsersChart();
    }, 100);
  }

  changeMainChartType(type: 'doughnut' | 'bar' | 'pie'): void {
    this.mainChartType = type;
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.createMainChart(this.mostPerformedServices);
    }
  }

  private createMainChart(data: ServiceData[]): void {
    if (!this.chartCanvas?.nativeElement || data.length === 0) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#FDC030', '#1976d2', '#10b981', '#ef4444', '#8b5cf6', 
      '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#f59e0b'
    ];

    this.chartInstance = new Chart(ctx, {
      type: this.mainChartType,
      data: {
        labels: data.map(item => item.name),
        datasets: [{
          label: 'Cantidad de servicios',
          data: data.map(item => item.count),
          backgroundColor: colors,
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
              padding: 15, 
              usePointStyle: true, 
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: (context: any) => {
                const service = data[context.dataIndex];
                return service.value ? `Valor: $${service.value.toLocaleString()}` : '';
              }
            }
          }
        }
      }
    });
  }

  private createAppointmentsChart(): void {
    if (!this.appointmentsCanvas?.nativeElement) return;

    if (this.appointmentsChartInstance) {
      this.appointmentsChartInstance.destroy();
    }

    const ctx = this.appointmentsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.userPerformance.slice(0, 8);

    this.appointmentsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(u => u.user_name),
        datasets: [
          {
            label: 'Pendientes',
            data: data.map(u => u.pending_count),
            backgroundColor: '#FDC030',
            borderRadius: 6
          },
          {
            label: 'Completadas',
            data: data.map(u => u.completed_count),
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private createTimelineChart(response: any): void {
    if (!this.timelineCanvas?.nativeElement) return;

    if (this.timelineChartInstance) {
      this.timelineChartInstance.destroy();
    }

    const ctx = this.timelineCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    let labels: string[] = [];
    let data: number[] = [];

    if (response.monthly && typeof response.monthly === 'object') {
      const sorted = Object.keys(response.monthly).sort();
      labels = sorted.map(k => this.formatMonthLabel(k));
      data = sorted.map(k => response.monthly[k]);
    }

    this.timelineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Servicios por período',
          data: data,
          borderColor: '#44fee2',
          backgroundColor: 'rgba(68, 254, 226, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  private createUsersChart(): void {
    if (!this.usersCanvas?.nativeElement) return;

    if (this.usersChartInstance) {
      this.usersChartInstance.destroy();
    }

    const ctx = this.usersCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const topUsers = this.userPerformance.slice(0, 8);

    this.usersChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topUsers.map(u => u.user_name),
        datasets: [{
          label: 'Valor Total (miles)',
          data: topUsers.map(u => u.total_value / 1000),
          backgroundColor: '#1976d2',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private formatMonthLabel(monthKey: string): string {
    const parts = monthKey.split('-');
    if (parts.length < 2) return monthKey;
    const year = parts[0];
    const month = Number(parts[1]);
    const date = new Date(Number(year), month - 1, 1);
    return date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.clearOtherMessages('success');
    setTimeout(() => { this.successMessage = ''; }, 5000);
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.clearOtherMessages('error');
    setTimeout(() => { this.errorMessage = ''; }, 5000);
  }

  private showInfoMessage(message: string): void {
    this.infoMessage = message;
    this.clearOtherMessages('info');
    setTimeout(() => { this.infoMessage = ''; }, 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.infoMessage = '';
  }

  private clearOtherMessages(except: 'success' | 'error' | 'info'): void {
    if (except !== 'success') this.successMessage = '';
    if (except !== 'error') this.errorMessage = '';
    if (except !== 'info') this.infoMessage = '';
  }
}