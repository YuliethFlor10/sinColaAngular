import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ReportsService } from '../../../services/reports.service';
import { AuthService, User } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { environment } from '../../../../environments/environment';

// Importar Chart.js
declare var Chart: any;

// Interfaz para una cita del backend
interface AppointmentDetail {
  id: number;
  fecha: string;
  fecha_fin?: string;
  nota?: string;
  cliente?: {
    nombre?: string;
    email?: string;
    tipo_doc?: string;
    num_doc?: string;
    fecha_nac?: string;
    telefono?: string;
  };
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_tipo_doc?: string;
  cliente_num_doc?: string;
  cliente_fecha_nac?: string;
  cliente_telefono?: string;
  service?: {
    nombre?: string;
    tiempo_estimado?: number;
    precio?: string | number;
    descripcion?: string;
  };
  user?: {
    nombres?: string;
    apellidos?: string;
    email?: string;
  };
  status?: {
    nombre?: string;
  };
  estado?: string;
  // Campos procesados
  fechaFormateada: string;
  horaFormateada: string;
  clienteNombre: string;
  servicioNombre: string;
  empleadoNombre: string;
  precio: number;
}

// Interfaz para la respuesta del backend
interface ReportResponse {
  citas?: AppointmentDetail[];
  resumen?: {
    total_citas: number;
    ganancia_total: number;
    promedio_por_cita: number;
  };
  graficos?: {
    datos_por_fecha?: Array<{
      fecha: string;
      ganancia: number;
      cantidad_citas: number;
    }>;
  };
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
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('appointmentsChart') appointmentsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('serviceChart') serviceChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Variables del formulario de informes
  startDate: string = '';
  endDate: string = '';
  dateRangeType: 'diario' | 'mensual' | 'personalizado' = 'mensual';
  selectedEmployeeId: number | null = null;
  employees: Array<any> = [];
  isGenerating: boolean = false;
  showChart: boolean = false;
  showReport: boolean = false;

  // Variables del usuario actual
  currentUser: User | null = null;
  isEmployee: boolean = false;
  isBusiness: boolean = false;
  currentBusinessId: number | null = null;

  // Variables del resumen
  mostPerformedServices: MostPerformedService[] = [];
  totalValue: number = 0;
  totalRevenue: number = 0;
  totalAppointments: number = 0;
  averagePerAppointment: number = 0;
  totalRecords: number = 0;
  averagePerMonth: number = 0;
  bestMonthLabel: string = '';

  // Datos de citas
  filteredAppointments: AppointmentDetail[] = [];
  dateGroupedData: Array<{ date: string; revenue: number; count: number }> = [];
  statusGroupedData: Array<{ status: string; count: number }> = [];
  serviceGroupedData: Array<{ service: string; count: number }> = [];
  
  // Mensajes de estado
  successMessage: string = '';
  errorMessage: string = '';
  infoMessage: string = '';
  noDataMessage: string = 'Selecciona un rango de fechas para generar el informe.';

  // Chart.js instances
  chartInstance: any = null;
  revenueChartInstance: any = null;
  appointmentsChartInstance: any = null;
  statusChartInstance: any = null;
  serviceChartInstance: any = null;

  // URL base de la API
  private apiUrl = environment.apiUrl;

  constructor(
    private reportsService: ReportsService,
    private http: HttpClient,
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.initializeDates();
    
    // Si es un negocio, cargar empleados
    if (this.isBusiness) {
      this.loadEmployees();
    }
  }

  ngAfterViewInit() {
    // El canvas está disponible aquí
  }

  ngOnDestroy() {
    // Limpiar los gráficos al destruir el componente
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.revenueChartInstance) {
      this.revenueChartInstance.destroy();
    }
    if (this.appointmentsChartInstance) {
      this.appointmentsChartInstance.destroy();
    }
    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
    }
    if (this.serviceChartInstance) {
      this.serviceChartInstance.destroy();
    }
  }

  // ===========================================
  // SECCIÓN: INICIALIZACIÓN
  // ===========================================




  // ===========================================
  // SECCIÓN: MANEJO DE ERRORES HTTP
  // ===========================================

  /**
   * Maneja errores HTTP de manera genérica
   * @param operation - Nombre de la operación que falló
   * @returns Función que maneja el error
   */
  private handleError<T>(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      let errorMessage = 'Error desconocido';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Error del lado del servidor
        errorMessage = `Error ${error.status}: ${error.message}`;

        // Manejar errores específicos del servidor
        if (error.status === 0) {
          errorMessage = 'No se pudo conectar al servidor. Verifique su conexión a internet.';
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado en el servidor.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor.';
        } else if (error.status === 422) {
          errorMessage = 'Datos de entrada inválidos.';
        }
      }

      // Retornar un observable con un resultado de error
      return throwError(() => new Error(errorMessage));
    };
  }

  // ===========================================
  // SECCIÓN: FUNCIONES DE INFORMES
  // ===========================================

  /**
   * Carga el usuario actual y determina su rol
   */
  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.isEmployee = this.currentUser.roles_id === 3;
      this.isBusiness = this.currentUser.roles_id === 1 || this.currentUser.roles_id === 4;
      this.currentBusinessId = this.currentUser.negocios_id || null;
    }
  }

  /**
   * Carga los empleados del negocio actual
   */
  loadEmployees(): void {
    if (!this.currentBusinessId) {
      console.warn('⚠️ No hay businessId disponible');
      return;
    }

    console.log(`📡 Cargando empleados del negocio ${this.currentBusinessId}`);
    
    this.usersService.getStaffByBusiness(this.currentBusinessId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de empleados:', response);
        
        // Manejar diferentes formatos de respuesta
        let employeesData: any[] = [];
        if (Array.isArray(response)) {
          employeesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          employeesData = response.data;
        } else if (response.success && Array.isArray(response.data)) {
          employeesData = response.data;
        }

        // Normalizar datos de empleados
        this.employees = employeesData.map((emp: any) => {
          // Asegurar que tenga nombre_completo
          if (!emp.nombre_completo && emp.nombres && emp.apellidos) {
            emp.nombre_completo = `${emp.nombres} ${emp.apellidos}`.trim();
          }
          return emp;
        });

        console.log(`✅ ${this.employees.length} empleados cargados:`, this.employees);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar empleados:', error);
        this.showErrorMessage('Error al cargar la lista de empleados. Verifica tu conexión.');
        this.employees = [];
      }
    });
  }

  private initializeDates() {
    const today = new Date();
    
    switch (this.dateRangeType) {
      case 'diario':
        this.startDate = this.formatDate(today);
        this.endDate = this.formatDate(today);
        break;
      case 'mensual':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        this.startDate = this.formatDate(firstDay);
        this.endDate = this.formatDate(today);
        break;
      case 'personalizado':
        const firstDayCustom = new Date(today.getFullYear(), today.getMonth(), 1);
        this.startDate = this.formatDate(firstDayCustom);
        this.endDate = this.formatDate(today);
        break;
    }
  }

  /**
   * Maneja el cambio de tipo de rango de fechas
   */
  onDateRangeTypeChange(): void {
    this.initializeDates();
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

  onEmployeeChange() {
    // Si hay datos mostrados, regenerar automáticamente
    if (this.showReport) {
      this.generateReport();
    }
  }

  generateReport() {
    // Validaciones
    if (this.dateRangeType === 'personalizado' && (!this.startDate || !this.endDate)) {
      this.showErrorMessage('Por favor, selecciona las fechas para el rango personalizado.');
      return;
    }

    this.isGenerating = true;
    this.clearMessages();
    this.showChart = false;
    this.showReport = false;

    // Construir parámetros de consulta
    const params: any = {
      tipo_fecha: this.dateRangeType
    };

    if (this.dateRangeType === 'personalizado') {
      params.fecha_inicio = this.startDate;
      params.fecha_fin = this.endDate;
    }

    // Si es un negocio y hay un empleado seleccionado, agregar el filtro
    if (this.isBusiness && this.selectedEmployeeId) {
      params.empleado_id = this.selectedEmployeeId;
    }

    // Si es un empleado, el backend debe filtrar automáticamente por su ID
    // (esto se maneja en el backend basado en el token de autenticación)

    console.log('📤 Parámetros de la petición:', params);

    // Llamar al endpoint del backend
    this.getReportFromApi(params).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del backend:', response);
        this.processReportResponse(response);
        this.isGenerating = false;
        this.showSuccessMessage('Informe generado exitosamente.');
        this.showChart = true;
        this.showReport = true;
      },
      error: (err: any) => {
        console.error('❌ Error al generar informe:', err);
        const errorMsg = err?.error?.message || err?.message || 'Error al generar el informe.';
        this.showErrorMessage(errorMsg);
        this.isGenerating = false;
      }
    });
  }

  /**
   * Obtiene el informe desde el backend
   */
  private getReportFromApi(params: any): Observable<ReportResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    // Construir query string
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key].toString());
      }
    });

    const url = `${this.apiUrl}/appointments/report?${queryParams.toString()}`;
    
    return this.http.get<ReportResponse>(url, { headers }).pipe(
      catchError(this.handleError<ReportResponse>('getReportFromApi'))
    );
  }

  private processReportResponse(response: any) {
    console.log('📥 Procesando respuesta:', response);

    if (!response) {
      this.noDataMessage = 'No hay datos disponibles para el período seleccionado.';
      this.filteredAppointments = [];
      return;
    }

    // Procesar citas - manejar diferentes formatos
    // El backend devuelve 'citas_detalladas' según la documentación
    let rawAppointments: any[] = [];
    if (response.citas_detalladas && Array.isArray(response.citas_detalladas)) {
      rawAppointments = response.citas_detalladas;
    } else if (response.citas && Array.isArray(response.citas)) {
      rawAppointments = response.citas;
    } else if (Array.isArray(response)) {
      rawAppointments = response;
    } else if (response.data && Array.isArray(response.data)) {
      rawAppointments = response.data;
    }

    console.log(`📋 ${rawAppointments.length} citas encontradas`);

    // Filtrar solo citas confirmadas y mapear datos
    this.filteredAppointments = rawAppointments
      .filter(apt => {
        const estado = apt.status?.nombre || apt.estado || '';
        return estado.toLowerCase() === 'confirmada' || estado.toLowerCase() === 'confirmed';
      })
      .map(apt => this.mapAppointmentData(apt));

    console.log(`✅ ${this.filteredAppointments.length} citas confirmadas procesadas`);

    // Calcular resumen
    this.calculateSummary();

    // Agrupar datos para gráficas
    this.groupDataForCharts();

    // Mapear datos del resumen (si viene del backend)
    if (response.resumen) {
      this.totalAppointments = response.resumen.total_citas || this.filteredAppointments.length;
      this.totalRevenue = response.resumen.ganancia_total || this.calculateTotalRevenue();
      this.averagePerAppointment = response.resumen.promedio_por_cita || this.calculateAverageRevenue();
      this.totalValue = this.totalRevenue;
    } else {
      // Si no viene resumen, calcular desde las citas
      this.calculateSummary();
    }

    // Mapear datos para gráficos de fecha (si vienen del backend)
    if (response.graficos?.datos_por_fecha && Array.isArray(response.graficos.datos_por_fecha)) {
      this.dateGroupedData = response.graficos.datos_por_fecha.map((item: any) => ({
        date: item.fecha,
        revenue: item.ganancia || 0,
        count: item.cantidad_citas || 0
      }));
    }

    // Mapear servicios más realizados (si viene del backend)
    if (response.servicios_mas_realizados && Array.isArray(response.servicios_mas_realizados)) {
      this.mostPerformedServices = response.servicios_mas_realizados.map((item: any) => ({
        name: item.nombre || item.name || 'Sin nombre',
        count: item.cantidad || item.count || 0
      }));
    }

    // Generar gráficos
    setTimeout(() => {
      this.createCharts();
    }, 200);
  }

  /**
   * Mapea los datos de una cita con fallbacks
   */
  private mapAppointmentData(apt: any): AppointmentDetail {
    const mapped: AppointmentDetail = { ...apt };

    // Cliente - usar datos del objeto cliente o campos directos, con fallback a user
    mapped.clienteNombre = 
      apt.cliente?.nombre || 
      apt.cliente_nombre ||
      apt.nombre ||
      (apt.user?.nombres && apt.user?.apellidos ? `${apt.user.nombres} ${apt.user.apellidos}`.trim() : '') ||
      apt.user?.nombres ||
      'Sin nombre';

    // Servicio
    mapped.servicioNombre = 
      apt.service?.nombre || 
      apt.servicio ||
      apt.tipo_cita ||
      'Sin servicio';

    // Precio
    mapped.precio = 
      typeof apt.service?.precio === 'string' 
        ? parseFloat(apt.service.precio) 
        : (apt.service?.precio || apt.precio || 0);

    // Empleado
    if (apt.user) {
      if (typeof apt.user === 'string') {
        mapped.empleadoNombre = apt.user;
      } else if (apt.user.nombres && apt.user.apellidos) {
        mapped.empleadoNombre = `${apt.user.nombres} ${apt.user.apellidos}`.trim();
      } else if (apt.user.nombres) {
        mapped.empleadoNombre = apt.user.nombres;
      } else {
        mapped.empleadoNombre = 'Sin asignar';
      }
    } else if (apt.personal_servicio) {
      mapped.empleadoNombre = apt.personal_servicio;
    } else {
      mapped.empleadoNombre = 'Sin asignar';
    }

    // Fecha y hora
    if (apt.fecha) {
      try {
        const date = new Date(apt.fecha);
        mapped.fechaFormateada = date.toLocaleDateString('es-CO', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
        mapped.horaFormateada = date.toLocaleTimeString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch {
        mapped.fechaFormateada = apt.fecha.split(' ')[0] || apt.fecha;
        mapped.horaFormateada = apt.fecha.split(' ')[1]?.substring(0, 5) || 'N/A';
      }
    } else {
      mapped.fechaFormateada = 'N/A';
      mapped.horaFormateada = 'N/A';
    }

    return mapped;
  }

  /**
   * Calcula el resumen desde las citas
   */
  private calculateSummary(): void {
    this.totalAppointments = this.filteredAppointments.length;
    this.totalRevenue = this.calculateTotalRevenue();
    this.averagePerAppointment = this.calculateAverageRevenue();
    this.totalValue = this.totalRevenue;
  }

  /**
   * Calcula el total de ganancias
   */
  private calculateTotalRevenue(): number {
    return this.filteredAppointments.reduce((sum, apt) => {
      return sum + (apt.precio || 0);
    }, 0);
  }

  /**
   * Calcula el promedio de ganancias por cita
   */
  private calculateAverageRevenue(): number {
    if (this.filteredAppointments.length === 0) return 0;
    return this.totalRevenue / this.filteredAppointments.length;
  }

  /**
   * Agrupa datos para las gráficas
   */
  private groupDataForCharts(): void {
    // Agrupar por estado
    const statusMap = new Map<string, number>();
    this.filteredAppointments.forEach(apt => {
      const estado = apt.status?.nombre || apt.estado || 'Confirmada';
      statusMap.set(estado, (statusMap.get(estado) || 0) + 1);
    });
    this.statusGroupedData = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Agrupar por servicio
    const serviceMap = new Map<string, number>();
    this.filteredAppointments.forEach(apt => {
      const servicio = apt.servicioNombre || 'Sin servicio';
      serviceMap.set(servicio, (serviceMap.get(servicio) || 0) + 1);
    });
    this.serviceGroupedData = Array.from(serviceMap.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    // Agrupar por fecha (si no viene del backend)
    if (this.dateGroupedData.length === 0) {
      const dateMap = new Map<string, { revenue: number; count: number }>();
      this.filteredAppointments.forEach(apt => {
        const fecha = apt.fecha ? apt.fecha.split(' ')[0] : apt.fechaFormateada;
        if (fecha) {
          if (!dateMap.has(fecha)) {
            dateMap.set(fecha, { revenue: 0, count: 0 });
          }
          const data = dateMap.get(fecha)!;
          data.revenue += apt.precio || 0;
          data.count += 1;
        }
      });
      this.dateGroupedData = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Actualizar servicios más realizados
    this.mostPerformedServices = this.serviceGroupedData
      .slice(0, 10)
      .map(item => ({ name: item.service, count: item.count }));
  }


  /**
   * Crea los gráficos de ganancias y citas
   */
  private createCharts(): void {
    console.log('📊 Creando gráficos...');
    
    // Destruir gráficos anteriores
    if (this.revenueChartInstance) {
      this.revenueChartInstance.destroy();
      this.revenueChartInstance = null;
    }
    if (this.appointmentsChartInstance) {
      this.appointmentsChartInstance.destroy();
      this.appointmentsChartInstance = null;
    }
    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
      this.statusChartInstance = null;
    }
    if (this.serviceChartInstance) {
      this.serviceChartInstance.destroy();
      this.serviceChartInstance = null;
    }

    // Gráfico de ganancias por fecha
    if (this.revenueChartCanvas?.nativeElement && this.dateGroupedData.length > 0) {
      const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const dates = this.dateGroupedData.map(d => this.formatDateForDisplay(d.date));
        const revenues = this.dateGroupedData.map(d => d.revenue);

        this.revenueChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'Ganancias (COP)',
              data: revenues,
              borderColor: '#4ec4ff',
              backgroundColor: 'rgba(78, 196, 255, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Evolución de Ganancias',
                font: { size: 16, weight: 'bold' }
              },
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value: any) {
                    return new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(value);
                  }
                }
              }
            }
          }
        });
      }
    }

    // Gráfico de cantidad de citas por fecha
    if (this.appointmentsChartCanvas?.nativeElement && this.dateGroupedData.length > 0) {
      const ctx = this.appointmentsChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const dates = this.dateGroupedData.map(d => this.formatDateForDisplay(d.date));
        const counts = this.dateGroupedData.map(d => d.count);

        this.appointmentsChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dates,
            datasets: [{
              label: 'Citas Confirmadas',
              data: counts,
              backgroundColor: '#fe57b8',
              borderColor: '#ee66fd',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Cantidad de Citas por Fecha',
                font: { size: 16, weight: 'bold' }
              },
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }

    // Gráfico de citas por estado
    if (this.statusChartCanvas?.nativeElement && this.statusGroupedData.length > 0) {
      const ctx = this.statusChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const labels = this.statusGroupedData.map(d => d.status);
        const data = this.statusGroupedData.map(d => d.count);
        const colors = ['#4ec4ff', '#fe57b8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

        this.statusChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors.slice(0, labels.length),
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Citas por Estado',
                font: { size: 16, weight: 'bold' }
              },
              legend: {
                display: true,
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    // Gráfico de citas por servicio
    if (this.serviceChartCanvas?.nativeElement && this.serviceGroupedData.length > 0) {
      const ctx = this.serviceChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const topServices = this.serviceGroupedData.slice(0, 10);
        const labels = topServices.map(d => d.service);
        const data = topServices.map(d => d.count);

        this.serviceChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Cantidad de Citas',
              data: data,
              backgroundColor: '#4ec4ff',
              borderColor: '#3b82f6',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Citas por Servicio (Top 10)',
                font: { size: 16, weight: 'bold' }
              },
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }
  }

  /**
   * Formatea una fecha para mostrar
   */
  private formatDateForDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    } catch {
      return dateString;
    }
  }

  // ===========================================
  // SECCIÓN: MANEJO DE MENSAJES
  // ===========================================

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
}