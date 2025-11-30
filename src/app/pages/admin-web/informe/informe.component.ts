import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { ReportsService } from '../../../services/reports.service';

declare var Chart: any;

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
export class InformeComponent implements OnInit, OnDestroy {
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

  // Datos originales
  allUsers: any[] = [];
  allServices: any[] = [];
  allAppointments: any[] = [];

  // Datos filtrados
  users: any[] = [];
  filteredUsers: any[] = [];
  
  // Estados
  isGenerating: boolean = false;
  showChart: boolean = false;
  
  // Estadísticas
  mostPerformedServices: any[] = [];
  totalValue: number = 0;
  totalRecords: number = 0;
  totalPending: number = 0;
  totalCompleted: number = 0;
  averagePerMonth: number = 0;
  userPerformance: any[] = [];
  
  // Estadísticas por rol
  propietarioStats = {
    totalServices: 0,
    totalValue: 0,
    services: [] as any[]
  };
  
  empleadoStats = {
    pendingAppointments: 0,
    completedAppointments: 0,
    totalValue: 0,
    topReserver: '',
    reservations: [] as any[]
  };
  
  administradorStats = {
    pendingAppointments: 0,
    completedAppointments: 0,
    totalValue: 0,
    topReserver: '',
    reservations: [] as any[]
  };
  
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

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.initializeDates();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
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

loadAllData(): void {
    console.log('📡 Cargando datos...');
    
    this.reportsService.getAllData().subscribe({
      next: (data) => {
        console.log('✅ Datos cargados:', data);
        
        this.allUsers = data.users || [];
        this.allServices = data.services || [];
        this.allAppointments = data.appointments || [];
        
        // 🔍 DIAGNÓSTICO COMPLETO
        if (this.allAppointments.length > 0) {
          console.log('📊 ===== DIAGNÓSTICO DE DATOS CARGADOS =====');
          
          const citasConService = this.allAppointments.filter(apt => apt.service !== null).length;
          console.log(`✅ Citas con service: ${citasConService} de ${this.allAppointments.length}`);
          
          if (citasConService === 0) {
            console.error('❌❌❌ NINGUNA CITA TIENE SERVICE CARGADO');
            console.error('🔧 ACCIÓN REQUERIDA:');
            console.error('   1. Verificar AppointmentController->index()');
            console.error('   2. Debe incluir: ->with([\'user\', \'business\', \'status\', \'service\', \'agenda\'])');
          }
          
          // Mostrar ejemplo de cita
          const ejemploCita = this.allAppointments[0];
          console.log('📝 Ejemplo de cita:', {
            id: ejemploCita.id,
            servicios_id: ejemploCita.servicios_id,
            service: ejemploCita.service ? '✅ EXISTE' : '❌ NULL',
            service_name: ejemploCita.service?.nombre || 'NO DISPONIBLE'
          });
          
          const userIdsWithAppointments = new Set(
            this.allAppointments.map((apt: any) => apt.usuarios_id || apt.user_id)
          );
          
          console.log('📊 IDs de usuarios que TIENEN citas:', Array.from(userIdsWithAppointments));
          console.log('===========================================');
        }
        
        this.filterUsers();
        this.showSuccessMessage('Datos cargados correctamente');
      },
      error: (err) => {
        console.error('❌ Error cargando datos:', err);
        this.showErrorMessage('Error al cargar los datos');
      }
    });
  }

  filterUsers(): void {
    this.users = this.allUsers;
    
    if (this.selectedRole === 'all') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(u => 
        u.role?.toLowerCase() === this.selectedRole.toLowerCase() ||
        u.role?.nombre?.toLowerCase() === this.selectedRole.toLowerCase()
      );
    }
    
    console.log('👥 Usuarios filtrados para selector:', this.filteredUsers.length);
    
    // Agregar opción "Todos" al inicio
    this.filteredUsers = [
      { id: null, nombres: 'Todos', apellidos: 'los usuarios', role: this.selectedRole },
      ...this.filteredUsers
    ];
  }

  onRoleChange(): void {
    this.filterUsers();
    this.selectedUserId = null;
    if (this.showChart) {
      this.generateReport();
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

  generateReport(): void {
    if (!this.startDate || !this.endDate) {
      this.showErrorMessage('Selecciona las fechas');
      return;
    }

    console.log('📊 ========== GENERANDO INFORME ==========');
    console.log('Filtros aplicados:', {
      startDate: this.startDate,
      endDate: this.endDate,
      selectedUserId: this.selectedUserId,
      selectedRole: this.selectedRole,
      selectedStatus: this.selectedStatus
    });
    
    this.isGenerating = true;
    this.showChart = false;
    this.resetStats();

    // Filtrar citas por fechas
    const startTime = new Date(this.startDate).getTime();
    const endTime = new Date(this.endDate).getTime();

    let filteredAppointments = this.allAppointments.filter(apt => {
      const aptDate = new Date(apt.fecha || apt.date).getTime();
      return aptDate >= startTime && aptDate <= endTime;
    });

    console.log('📅 Total citas en BD:', this.allAppointments.length);
    console.log('📅 Citas en rango de fechas:', filteredAppointments.length);

    // Filtrar por usuario si está seleccionado
    if (this.selectedUserId && this.selectedUserId !== null) {
      const beforeFilter = filteredAppointments.length;
      
      filteredAppointments = filteredAppointments.filter(apt => {
        const aptUserId = apt.usuarios_id || apt.user_id;
        return Number(aptUserId) === Number(this.selectedUserId);
      });
      
      console.log(`👤 Filtrado por usuario ${this.selectedUserId}: ${beforeFilter} → ${filteredAppointments.length} citas`);
      
      if (filteredAppointments.length === 0) {
        console.warn('⚠️ Este usuario NO tiene citas en el rango seleccionado');
        console.warn('💡 Sugerencia: Selecciona "Todos" en el selector de persona');
      }
    } else {
      console.log('👥 Mostrando citas de TODOS los usuarios');
    }

    // Filtrar por rol si está seleccionado
    if (this.selectedRole && this.selectedRole !== 'all') {
      const beforeFilter = filteredAppointments.length;
      
      filteredAppointments = filteredAppointments.filter(apt => {
        const userId = apt.usuarios_id || apt.user_id;
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return false;
        
        const userRole = (user.role?.nombre || user.role || '').toLowerCase();
        return userRole === this.selectedRole.toLowerCase();
      });
      
      console.log(`🎭 Filtrado por rol ${this.selectedRole}: ${beforeFilter} → ${filteredAppointments.length} citas`);
    }

    // Filtrar por estado si está seleccionado
    if (this.selectedStatus !== 'all') {
      const beforeFilter = filteredAppointments.length;
      
      filteredAppointments = filteredAppointments.filter(apt => {
        const status = apt.status?.nombre || apt.status_name || '';
        return status.toLowerCase().includes(this.selectedStatus.toLowerCase());
      });
      
      console.log(`📋 Filtrado por estado ${this.selectedStatus}: ${beforeFilter} → ${filteredAppointments.length} citas`);
    }

    // ✅ DIAGNÓSTICO DETALLADO
    console.log('📊 ===== DIAGNÓSTICO DE CITAS FILTRADAS =====');
    filteredAppointments.slice(0, 3).forEach((apt, i) => {
      console.log(`Cita ${i + 1}:`, {
        id: apt.id,
        fecha: apt.fecha || apt.date,
        usuario_id: apt.usuarios_id || apt.user_id,
        servicio_id: apt.servicios_id || apt.service_id,
        service_object: apt.service ? '✅ CARGADO' : '❌ NULL',
        service_name: apt.service?.nombre || 'NO DISPONIBLE',
        status: apt.status?.nombre || apt.status_name
      });
    });
    
    // ✅ VALIDAR QUE LAS CITAS TENGAN SERVICIOS CARGADOS
    const citasConService = filteredAppointments.filter(apt => apt.service !== null).length;
    const citasSinService = filteredAppointments.length - citasConService;

    if (citasSinService > 0) {
      console.error(`⚠️⚠️⚠️ PROBLEMA: ${citasSinService} citas NO tienen service cargado`);
      console.error('💡 SOLUCIÓN: Verificar que el backend use ->with([\'service\']) en index()');
    }
    console.log('============================================');

    if (filteredAppointments.length === 0) {
      console.error('❌ NO HAY CITAS PARA PROCESAR');
      console.error('💡 Opciones:');
      console.error('   1. Cambia el rango de fechas');
      console.error('   2. Selecciona "Todos" en persona');
      console.error('   3. Verifica que haya citas en la BD');
    }

    // Procesar servicios más realizados
    this.processServices(filteredAppointments);

    // Procesar performance de usuarios
    this.processUserPerformance(filteredAppointments);

    // Procesar stats por rol
    this.processRoleStats(filteredAppointments);

    // Calcular promedio mensual
    this.calculateAveragePerMonth(filteredAppointments);

    // Crear gráficas
    setTimeout(() => {
      this.createAllCharts(filteredAppointments);
      this.isGenerating = false;
      this.showChart = true;
      
      if (filteredAppointments.length > 0) {
        this.showSuccessMessage('Informe generado exitosamente');
      } else {
        this.showErrorMessage('No hay datos para mostrar con los filtros seleccionados');
      }
    }, 500);
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

private processServices(appointments: any[]): void {
    const serviceMap = new Map<number, any>();

    console.log('🛠️ Procesando servicios con', appointments.length, 'citas');
    
    appointments.forEach(apt => {
      // 🔥 USAR DIRECTAMENTE apt.service SI VIENE CARGADO
      const service = apt.service || this.allServices.find(s => s.id === (apt.servicios_id || apt.service_id));
      
      if (service) {
        const serviceId = service.id;
        
        if (!serviceMap.has(serviceId)) {
          serviceMap.set(serviceId, {
            name: service.nombre || service.name,
            count: 0,
            value: 0,
            price: parseFloat(service.precio || service.price || 0)
          });
        }
        
        const serviceData = serviceMap.get(serviceId);
        serviceData.count++;
        serviceData.value = serviceData.count * serviceData.price;
      } else {
        console.warn('⚠️ Cita sin servicio:', apt.id);
      }
    });

    this.mostPerformedServices = Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.totalValue = this.mostPerformedServices.reduce((sum, s) => sum + s.value, 0);
    this.totalRecords = this.mostPerformedServices.reduce((sum, s) => sum + s.count, 0);

    console.log('✅ Servicios procesados:', this.mostPerformedServices.length);
    console.log('💰 Valor total:', this.totalValue);
  }
  private processUserPerformance(appointments: any[]): void {
    const userMap = new Map<number, any>();

    console.log('👥 Procesando rendimiento de usuarios con', appointments.length, 'citas');

    appointments.forEach(apt => {
      const userId = apt.usuarios_id || apt.user_id;
      const user = this.allUsers.find(u => u.id === userId);
      
      if (user) {
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            user_name: `${user.nombres || user.name} ${user.apellidos || ''}`.trim(),
            role: user.role?.nombre || user.role,
            pending_count: 0,
            completed_count: 0,
            total_value: 0
          });
        }
        
        const userData = userMap.get(userId);
        const status = (apt.status?.nombre || apt.status_name || '').toLowerCase();
        
        if (status.includes('pendiente')) {
          userData.pending_count++;
        } else if (status.includes('completada') || status.includes('confirmada')) {
          userData.completed_count++;
          
         const service = apt.service || this.allServices.find(s => s.id === (apt.servicios_id || apt.service_id));
          if (service) {
            userData.total_value += parseFloat(service.precio || service.price || 0);
          }
        }
      }
    });

    this.userPerformance = Array.from(userMap.values())
      .sort((a, b) => b.completed_count - a.completed_count);

    this.totalPending = this.userPerformance.reduce((sum, u) => sum + u.pending_count, 0);
    this.totalCompleted = this.userPerformance.reduce((sum, u) => sum + u.completed_count, 0);

    console.log('📊 Usuarios con rendimiento:', this.userPerformance.length);
    console.log('⏳ Total pendientes:', this.totalPending);
    console.log('✅ Total completadas:', this.totalCompleted);
  }

  private processRoleStats(appointments: any[]): void {
    // Stats de propietario (servicios)
    this.propietarioStats.services = this.mostPerformedServices;
    this.propietarioStats.totalServices = this.totalRecords;
    this.propietarioStats.totalValue = this.totalValue;

    // Stats de empleados y administradores
    const empleados = this.userPerformance.filter(u => 
      u.role?.toLowerCase() === 'empleado'
    );
    const administradores = this.userPerformance.filter(u => 
      u.role?.toLowerCase() === 'administrador'
    );

    console.log('👷 Empleados encontrados:', empleados.length);
    console.log('👔 Administradores encontrados:', administradores.length);

    if (empleados.length > 0) {
      this.empleadoStats.pendingAppointments = empleados.reduce((sum, e) => sum + e.pending_count, 0);
      this.empleadoStats.completedAppointments = empleados.reduce((sum, e) => sum + e.completed_count, 0);
      this.empleadoStats.totalValue = empleados.reduce((sum, e) => sum + e.total_value, 0);
      this.empleadoStats.reservations = empleados;
      this.empleadoStats.topReserver = empleados[0]?.user_name || 'N/A';
    }

    if (administradores.length > 0) {
      this.administradorStats.pendingAppointments = administradores.reduce((sum, a) => sum + a.pending_count, 0);
      this.administradorStats.completedAppointments = administradores.reduce((sum, a) => sum + a.completed_count, 0);
      this.administradorStats.totalValue = administradores.reduce((sum, a) => sum + a.total_value, 0);
      this.administradorStats.reservations = administradores;
      this.administradorStats.topReserver = administradores[0]?.user_name || 'N/A';
    }
  }

  private calculateAveragePerMonth(appointments: any[]): void {
    if (appointments.length === 0) {
      this.averagePerMonth = 0;
      return;
    }

    const monthMap = new Map<string, number>();
    
    appointments.forEach(apt => {
      const date = new Date(apt.fecha || apt.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    const monthsCount = monthMap.size || 1;
    this.averagePerMonth = +(appointments.length / monthsCount).toFixed(2);

    console.log('📅 Promedio por mes:', this.averagePerMonth);
  }

  private createAllCharts(appointments: any[]): void {
    if (this.selectedRole === 'propietario' || this.selectedRole === 'all') {
      this.createMainChart();
    }
    
    if (this.selectedRole === 'empleado' || this.selectedRole === 'administrador' || this.selectedRole === 'all') {
      this.createAppointmentsChart();
    }
    
    this.createTimelineChart(appointments);
    this.createUsersChart();
  }

  changeMainChartType(type: 'doughnut' | 'bar' | 'pie'): void {
    this.mainChartType = type;
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.createMainChart();
    }
  }

  private createMainChart(): void {
     if (!this.chartCanvas?.nativeElement) {
      console.warn('⚠️ Canvas no disponible para gráfico principal');
      return;
    }
    
    if (this.mostPerformedServices.length === 0) {
      console.warn('⚠️ No hay servicios para graficar');
      return;
    }
    
    console.log('📊 Creando gráfico con', this.mostPerformedServices.length, 'servicios');

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = ['#FDC030', '#1976d2', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#f59e0b'];

    this.chartInstance = new Chart(ctx, {
      type: this.mainChartType,
      data: {
        labels: this.mostPerformedServices.map(s => s.name),
        datasets: [{
          label: 'Cantidad',
          data: this.mostPerformedServices.map(s => s.count),
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
            labels: { padding: 15, usePointStyle: true, font: { size: 11 } }
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

    const topUsers = this.userPerformance.slice(0, 8);

    this.appointmentsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topUsers.map(u => u.user_name),
        datasets: [
          {
            label: 'Pendientes',
            data: topUsers.map(u => u.pending_count),
            backgroundColor: '#FDC030',
            borderRadius: 6
          },
          {
            label: 'Completadas',
            data: topUsers.map(u => u.completed_count),
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private createTimelineChart(appointments: any[]): void {
    if (!this.timelineCanvas?.nativeElement) return;

    if (this.timelineChartInstance) {
      this.timelineChartInstance.destroy();
    }

    const ctx = this.timelineCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const monthMap = new Map<string, number>();
    
    appointments.forEach(apt => {
      const date = new Date(apt.fecha || apt.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    const sortedMonths = Array.from(monthMap.keys()).sort();
    const labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    });
    const data = sortedMonths.map(m => monthMap.get(m) || 0);

    this.timelineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Citas por mes',
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
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
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
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private destroyCharts(): void {
    if (this.chartInstance) this.chartInstance.destroy();
    if (this.timelineChartInstance) this.timelineChartInstance.destroy();
    if (this.usersChartInstance) this.usersChartInstance.destroy();
    if (this.appointmentsChartInstance) this.appointmentsChartInstance.destroy();
  }

  private showSuccessMessage(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    this.infoMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showErrorMessage(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    this.infoMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  getUserName(user: any): string {
    if (!user) return 'Sin nombre';
    const nombre = user.nombres || user.name || user.firstName || '';
    const apellido = user.apellidos || user.lastname || user.lastName || '';
    const fullName = `${nombre} ${apellido}`.trim();
    return fullName || user.email || 'Usuario sin nombre';
  }

  getRoleName(user: any): string {
    if (!user) return 'Sin rol';
    
    if (user.role) {
      if (typeof user.role === 'string') {
        return user.role;
      }
      if (user.role.nombre) {
        return user.role.nombre;
      }
      if (user.role.name) {
        return user.role.name;
      }
    }
    
    return 'Sin rol';
  }
}