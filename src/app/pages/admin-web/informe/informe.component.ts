import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
    ReactiveFormsModule,
    HttpClientModule,
    AdminWeb, 
    ContenidoComponent
  ]
})
export class InformeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('servicesChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  currentView: 'reports' | 'users-list' | 'user-create' = 'reports';
  startDate: string = '';
  endDate: string = '';
  selectedUserId: number | null = null;
  users: Array<any> = [];
  isGenerating: boolean = false;
  showChart: boolean = false;
  mostPerformedServices: MostPerformedService[] = [];
  totalValue: number = 0;
  totalRecords: number = 0;
  averagePerMonth: number = 0;
  bestMonthLabel: string = '';
  isLoadingUsers: boolean = false;
  isCreatingUser: boolean = false;
  selectedUser: User | null = null;
  createUserForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  infoMessage: string = '';
  noDataMessage: string = 'Selecciona un rango de fechas y personal para generar el informe.';
  chartInstance: any = null;

  constructor(
    private reportsService: ReportsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeDates();
    this.initializeForm();
    this.loadUsers();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private initializeForm(): void {
    this.createUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  setCurrentView(view: 'reports' | 'users-list' | 'user-create'): void {
    this.currentView = view;
    this.clearMessages();
    if (view === 'users-list') {
      this.loadUsers();
    }
    if (view === 'user-create') {
      this.resetCreateUserForm();
    }
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.clearMessages();

    this.reportsService.getUsers().subscribe({
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
        this.showErrorMessage(error.message || 'Error de conexión al cargar usuarios.');
        this.users = [];
        this.isLoadingUsers = false;
      }
    });
  }

  loadUserById(userId: number): void {
    this.clearMessages();
    this.showInfoMessage('Cargando datos del usuario...');

    this.reportsService.getUserById(userId).subscribe({
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
        this.showErrorMessage(error.message || 'Error al cargar los datos del usuario.');
        this.selectedUser = null;
      }
    });
  }

  createUser(): void {
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched(this.createUserForm);
      this.showErrorMessage('Por favor, completa todos los campos correctamente.');
      return;
    }

    this.isCreatingUser = true;
    this.clearMessages();
    this.showInfoMessage('Creando usuario...');

    const userData: User = this.createUserForm.value;

    this.reportsService.createUser(userData).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success) {
          this.showSuccessMessage('Usuario creado exitosamente.');
          this.resetCreateUserForm();
          this.loadUsers();
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
        this.handleCreateUserErrors(error.errors || {});
        this.isCreatingUser = false;
      }
    });
  }

  private handleCreateUserErrors(errors: any): void {
    let errorMessage = 'Error al crear el usuario: ';
    if (errors.email) errorMessage += errors.email[0] + ' ';
    if (errors.name) errorMessage += errors.name[0] + ' ';
    if (errors.password) errorMessage += errors.password[0] + ' ';
    if (errorMessage === 'Error al crear el usuario: ') {
      errorMessage = 'Error desconocido al crear el usuario.';
    }
    this.showErrorMessage(errorMessage.trim());
  }

  private passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('password_confirmation')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  resetCreateUserForm(): void {
    this.createUserForm.reset();
    this.clearMessages();
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.createUserForm.get(fieldName);
    return !!(field?.errors && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.createUserForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${fieldName} es requerido.`;
      if (field.errors['email']) return 'El email no es válido.';
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres.`;
      if (field.errors['maxlength']) return `${fieldName} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (fieldName === 'password_confirmation' && this.createUserForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden.';
    }
    return '';
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

  generateReport(): void {
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

  private processReportResponse(response: any): void {
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
    this.mostPerformedServices = services
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ name: item.name, count: item.count }));
    this.totalValue = services.reduce((sum, item) => sum + (item.value || 0), 0);
    this.computeStatisticsFromResponse(response, services);
    this.createChart(services);
  }

  private computeStatisticsFromResponse(response: any, services: ServiceData[]): void {
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

  private monthsBetween(start: string, end: string): number {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
      return months > 0 ? months : 0;
    } catch {
      return 0;
    }
  }

  private formatMonthLabel(monthKey: string): string {
    const parts = monthKey.split('-');
    if (parts.length < 2) return monthKey;
    const year = parts[0];
    const month = Number(parts[1]);
    const date = new Date(Number(year), month - 1, 1);
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  private createChart(data: ServiceData[]): void {
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
                backgroundColor: ['#FDC030', '#1976d2', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'],
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
                  labels: { padding: 20, usePointStyle: true, font: { size: 12 } }
                },
                title: {
                  display: true,
                  text: `Servicios realizados - ${this.getPersonDisplayName()}`,
                  font: { size: 16, weight: 'bold' },
                  padding: { bottom: 20 }
                }
              },
              layout: { padding: 10 }
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