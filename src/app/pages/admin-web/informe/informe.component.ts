import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ReportsService } from '../../../services/reports.service';

// Importar Chart.js
declare var Chart: any;

// Interfaz para el usuario
interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Para campos adicionales
}

// Interfaz para la respuesta de la API
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

  // Variables de navegación
  currentView: 'reports' | 'users-list' | 'user-create' = 'reports';

  // Variables del formulario de informes
  startDate: string = '';
  endDate: string = '';
  selectedUserId: number | null = null;
  users: Array<any> = [];
  isGenerating: boolean = false;
  showChart: boolean = false;

  // Variables del resumen
  mostPerformedServices: MostPerformedService[] = [];
  totalValue: number = 0;
  totalRecords: number = 0;
  averagePerMonth: number = 0;
  bestMonthLabel: string = '';
  
  // Variables para gestión de usuarios
  isLoadingUsers: boolean = false;
  isCreatingUser: boolean = false;
  selectedUser: User | null = null;
  createUserForm!: FormGroup;
  
  // Mensajes de estado
  successMessage: string = '';
  errorMessage: string = '';
  infoMessage: string = '';
  noDataMessage: string = 'Selecciona un rango de fechas y personal para generar el informe.';

  // Chart.js instance
  chartInstance: any = null;

  // URL base de la API de Laravel
  private apiUrl = 'http://localhost:8000/api'; // Ajusta según tu configuración

  // Datos de ejemplo para la simulación de informes
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

  constructor(
    private reportsService: ReportsService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initializeDates();
    this.initializeForm();
    this.loadUsers();
  }

  ngAfterViewInit() {
    // El canvas está disponible aquí
  }

  ngOnDestroy() {
    // Limpiar el gráfico al destruir el componente
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  // ===========================================
  // SECCIÓN: INICIALIZACIÓN
  // ===========================================

  /**
   * Inicializa el formulario de creación de usuarios
   */
  private initializeForm(): void {
    this.createUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // ===========================================
  // SECCIÓN: GESTIÓN DE VISTAS
  // ===========================================

  /**
   * Cambia la vista actual del componente
   * @param view - Vista a mostrar
   */
  setCurrentView(view: 'reports' | 'users-list' | 'user-create') {
    this.currentView = view;
    this.clearMessages();

    // Si cambia a lista de usuarios, recargar datos
    if (view === 'users-list') {
      this.loadUsers();
    }

    // Si cambia a crear usuario, resetear formulario
    if (view === 'user-create') {
      this.resetCreateUserForm();
    }
  }

  // ===========================================
  // SECCIÓN: CONSULTA DE USUARIOS
  // ===========================================

  /**
   * Obtiene la lista completa de usuarios desde el backend
   */
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.clearMessages();

    this.getUsersFromApi().subscribe({
      next: (response: ApiResponse<User[]>) => {
        if (response.success) {
          this.users = response.data;
          if (this.users.length > 0 && !this.selectedUserId) {
            this.selectedUserId = this.users[0].id || null;
          }
          this.showSuccessMessage(`Se cargaron ${this.users.length} usuarios correctamente.`);
        } else {
          this.users = [];
          this.showErrorMessage(response.message || 'Error al obtener los usuarios.');
        }
        this.isLoadingUsers = false;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        this.showErrorMessage('Error de conexión al cargar usuarios. Verifique su conexión a internet.');
        this.users = [];
        this.isLoadingUsers = false;
      }
    });
  }

  /**
   * Obtiene un usuario específico por su ID
   * @param userId - ID del usuario a consultar
   */
  loadUserById(userId: number): void {
    this.clearMessages();
    this.showInfoMessage('Cargando datos del usuario...');

    this.getUserByIdFromApi(userId).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success) {
          this.selectedUser = response.data;
          this.showSuccessMessage('Usuario cargado correctamente.');
        } else {
          this.selectedUser = null;
          this.showErrorMessage(response.message || 'Usuario no encontrado.');
        }
      },
      error: (error: any) => {
        console.error('Error al cargar usuario por ID:', error);
        this.showErrorMessage('Error al cargar los datos del usuario.');
        this.selectedUser = null;
      }
    });
  }

  /**
   * Realiza la petición HTTP para obtener todos los usuarios
   * @returns Observable con la respuesta de la API
   */
  private getUsersFromApi(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`)
      .pipe(
        catchError(this.handleError<ApiResponse<User[]>>('getUsersFromApi'))
      );
  }

  /**
   * Realiza la petición HTTP para obtener un usuario por ID
   * @param userId - ID del usuario
   * @returns Observable con la respuesta de la API
   */
  private getUserByIdFromApi(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${userId}`)
      .pipe(
        catchError(this.handleError<ApiResponse<User>>('getUserByIdFromApi'))
      );
  }

  // ===========================================
  // SECCIÓN: REGISTRO DE USUARIOS
  // ===========================================

  /**
   * Crea un nuevo usuario en el sistema
   */
  createUser(): void {
    // Validar que el formulario sea válido
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched(this.createUserForm);
      this.showErrorMessage('Por favor, completa todos los campos correctamente.');
      return;
    }

    this.isCreatingUser = true;
    this.clearMessages();
    this.showInfoMessage('Creando usuario...');

    const userData: User = this.createUserForm.value;

    this.createUserInApi(userData).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success) {
          this.showSuccessMessage('Usuario creado exitosamente.');
          this.resetCreateUserForm();
          // Actualizar la lista de usuarios si estamos en esa vista
          if (this.currentView === 'users-list') {
            this.loadUsers();
          }
          // Cambiar a la vista de lista después de crear
          setTimeout(() => {
            this.setCurrentView('users-list');
          }, 2000);
        } else {
          this.handleCreateUserErrors(response.errors || {});
        }
        this.isCreatingUser = false;
      },
      error: (error: any) => {
        console.error('Error al crear usuario:', error);
        this.handleCreateUserErrors(error.error?.errors || {});
        this.isCreatingUser = false;
      }
    });
  }

  /**
   * Realiza la petición HTTP para crear un usuario
   * @param userData - Datos del usuario a crear
   * @returns Observable con la respuesta de la API
   */
  private createUserInApi(userData: User): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users`, userData)
      .pipe(
        catchError(this.handleError<ApiResponse<User>>('createUserInApi'))
      );
  }

  /**
   * Maneja los errores específicos de validación al crear usuario
   * @param errors - Objeto con los errores de validación
   */
  private handleCreateUserErrors(errors: any): void {
    let errorMessage = 'Error al crear el usuario: ';

    if (errors.email) {
      errorMessage += errors.email[0] + ' ';
    }
    if (errors.name) {
      errorMessage += errors.name[0] + ' ';
    }
    if (errors.password) {
      errorMessage += errors.password[0] + ' ';
    }

    if (errorMessage === 'Error al crear el usuario: ') {
      errorMessage = 'Error desconocido al crear el usuario.';
    }

    this.showErrorMessage(errorMessage.trim());
  }

  // ===========================================
  // SECCIÓN: FORMULARIOS Y VALIDACIONES
  // ===========================================

  /**
   * Validador personalizado para confirmar que las contraseñas coincidan
   * @param formGroup - FormGroup a validar
   * @returns Objeto con error o null si es válido
   */
  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('password_confirmation')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   * @param formGroup - FormGroup a marcar
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Resetea el formulario de crear usuario
   */
  resetCreateUserForm(): void {
    this.createUserForm.reset();
    this.clearMessages();
  }

  /**
   * Verifica si un campo específico del formulario tiene errores
   * @param fieldName - Nombre del campo
   * @returns true si el campo tiene errores y ha sido tocado
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.createUserForm.get(fieldName);
    return !!(field?.errors && field?.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName - Nombre del campo
   * @returns Mensaje de error o cadena vacía
   */
  getFieldError(fieldName: string): string {
    const field = this.createUserForm.get(fieldName);

    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${fieldName} es requerido.`;
      if (field.errors['email']) return 'El email no es válido.';
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres.`;
      if (field.errors['maxlength']) return `${fieldName} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres.`;
    }

    // Error de confirmación de contraseña
    if (fieldName === 'password_confirmation' && this.createUserForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden.';
    }

    return '';
  }

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

    this.reportsService.generateReport(this.selectedUserId, this.startDate, this.endDate)
      .subscribe({
        next: (res: any) => {
          this.processReportResponse(res);
          this.isGenerating = false;
          this.showSuccessMessage('Informe generado exitosamente.');
          this.showChart = true;
        },
        error: (err: any) => {
          console.error('Error generating report', err);
          this.showErrorMessage(err?.message || 'Error al generar el informe.');
          this.isGenerating = false;
        }
      });
  }

  private processReportResponse(response: any) {
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

    if (!services || services.length === 0) {
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

    this.computeStatisticsFromResponse(response, services);
    this.createChart(services);
  }

  private computeStatisticsFromResponse(response: any, services: ServiceData[]) {
    this.totalRecords = 0;
    this.averagePerMonth = 0;
    this.bestMonthLabel = '';

    const monthlyMap = new Map<string, number>();

    if (response.monthly && typeof response.monthly === 'object') {
      Object.keys(response.monthly).forEach(k => {
        monthlyMap.set(k, Number(response.monthly[k] || 0));
      });
    } else if (Array.isArray(response.records)) {
      response.records.forEach((r: any) => {
        const date = new Date(r.date);
        if (isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + (Number(r.count) || 1));
      });
    } else if (Array.isArray(response.activities)) {
      response.activities.forEach((d: any) => {
        const date = new Date(d);
        if (isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      });
    }

    if (monthlyMap.size === 0) {
      const total = services.reduce((s, it) => s + (it.count || 0), 0);
      this.totalRecords = total;
      const months = this.monthsBetween(this.startDate, this.endDate);
      this.averagePerMonth = months > 0 ? +(total / months).toFixed(2) : total;
      this.bestMonthLabel = 'No disponible';
      return;
    }

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
    const parts = monthKey.split('-');
    if (parts.length < 2) return monthKey;
    const year = parts[0];
    const month = Number(parts[1]);
    const date = new Date(Number(year), month - 1, 1);
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  private createChart(data: ServiceData[]) {
    setTimeout(() => {
      if (this.chartCanvas?.nativeElement) {
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
    if (this.users && this.selectedUserId != null) {
      const u = this.users.find(x => x.id === this.selectedUserId);
      if (u) return u.name || u.full_name || u.username || 'Seleccionado';
    }
    return 'Seleccionado';
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