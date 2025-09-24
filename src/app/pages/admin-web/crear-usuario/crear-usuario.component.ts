import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminWeb } from "../admin-web";
import { UsersService } from '../../../services/users.service';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';

// ========================================
// INTERFACES CORREGIDAS
// ========================================

interface ApiUserResponse {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  nacimiento?: string;
  genero?: 'M' | 'F' | 'O';
  identificacion: string;
  celular?: string;
  telefono?: string;
  direccion?: string;
  terminos_condiciones?: boolean;
  creado_en?: string;
  actualizado_en?: string;
  // Relaciones
  status?: {
    id: number;
    nombre: string;
  };
  role?: {
    id: number;
    nombre: string;
  };
  business?: {
    id: number;
    nombre: string;
  };
  identificationType?: {
    id: number;
    nombre: string;
    abreviatura: string;
  };
}

export interface User {
  id: number | string;
  documentType: string;
  documentNumber: string;
  name: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  userType: string;
  service?: string;
  createdAt?: Date;
  status?: 'active' | 'inactive';
  address?: string;
  gender?: 'M' | 'F' | 'O';
}

interface UserFormData {
  documentType: string;
  documentNumber: string;
  name: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  userType: string;
  password: string;
  confirmPassword: string;
  service: string;
}

interface ApiUserRequest {
  nombres: string;
  apellidos: string;
  email: string;
  nacimiento?: string | null;
  genero?: 'M' | 'F' | 'O';
  clave: string;
  tipo_identificacion_id: number;
  identificacion: string;
  celular?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  terminos_condiciones: boolean;
  estados_id: number;
  roles_id: number;
  negocios_id?: number | null;
}

@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AdminWeb, ContenidoComponent]
})
export class CrearUsuarioComponent implements OnInit, AfterViewInit, OnDestroy {

  // ========================================
  // PROPIEDADES PRINCIPALES
  // ========================================

  userForm!: FormGroup;
  isLoading: boolean = false;
  currentView: 'create-user' | 'list-users' = 'create-user';

  // Datos de usuarios
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Mensajes
  successMessage: string = '';
  errorMessage: string = '';

  // Edición
  editingUserId: number | string | null = null;
  isEditMode: boolean = false;

  // ========================================
  // DATOS MAESTROS
  // ========================================

  documentTypes = [
    { value: '', label: 'Seleccione el tipo' },
    { value: 'cedula', label: 'Cédula' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'tarjeta', label: 'Tarjeta de identidad' }
  ];

  userTypes = [
    { value: 'Cliente', label: 'Cliente' },
    { value: 'Admin', label: 'Administrador' },
    { value: 'Empleado', label: 'Empleado' }
  ];

  services = [
    { value: '', label: 'Seleccione los servicios' },
    { value: 'unas-semi', label: 'Uñas semi' },
    { value: 'unas-permanentes', label: 'Uñas permanentes' },
    { value: 'unas-tradicionales', label: 'Uñas tradicionales' },
    { value: 'pestanas', label: 'Pestañas' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService
  ) {
    this.userForm = this.createUserForm();
  }

  // ========================================
  // CICLO DE VIDA
  // ========================================

  ngOnInit(): void {
    this.initializeComponent();
    this.loadAllUsers();
  }

  ngAfterViewInit(): void {
    (window as any).crearUsuarioComponent = this;
    setTimeout(() => {
      this.setupDOMEvents();
    }, 100);
  }

  ngOnDestroy(): void {
    if ((window as any).crearUsuarioComponent === this) {
      delete (window as any).crearUsuarioComponent;
    }
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private initializeComponent(): void {
    this.userForm = this.createUserForm();
  }

  private setupDOMEvents(): void {
    try {
      // Eventos para alternar vistas
      const toggleButtons = document.querySelectorAll('.toggle-view-button');
      toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const target = (e.target as HTMLElement).closest('button')?.getAttribute('data-target-section');
          if (target) {
            this.toggleView(target);
          }
        });
      });

      // Evento para el formulario
      const form = document.getElementById('userForm') as HTMLFormElement;
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.onSubmit();
        });
      }

      // Evento para búsqueda
      const searchInput = document.getElementById('userSearch') as HTMLInputElement;
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchTerm = (e.target as HTMLInputElement).value;
          this.filterUsers();
        });
      }

      // Eventos para paginación
      const prevBtn = document.getElementById('prevPage');
      const nextBtn = document.getElementById('nextPage');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.previousPage());
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.nextPage());
      }

      console.log('Eventos del DOM configurados correctamente');
    } catch (error) {
      console.warn('Error configurando eventos del DOM:', error);
    }
  }

  // ========================================
  // CARGA DE DATOS - PROBLEMA PRINCIPAL CORREGIDO
  // ========================================

  /**
   * CORREGIDO: Maneja correctamente la respuesta paginada de Laravel
   */
  private loadAllUsers(): void {
    this.isLoading = true;
    console.log('🔄 Cargando usuarios desde la API...');

    this.usersService.getAll().subscribe({
      next: (response: any) => {
        try {
          console.log('📡 Respuesta completa de la API:', response);
          console.log('📊 Tipo de respuesta:', typeof response);
          console.log('🔍 Es array?', Array.isArray(response));
          console.log('🔍 Tiene .data?', response?.data ? 'SÍ' : 'NO');

          let rawUsers: ApiUserResponse[] = [];

          // CORREGIDO: Manejo de respuesta paginada de Laravel
          if (response && response.data && Array.isArray(response.data)) {
            // Respuesta paginada: { data: [...], current_page: 1, ... }
            rawUsers = response.data;
            console.log('✅ Respuesta paginada detectada. Usuarios extraídos:', rawUsers.length);
          } else if (Array.isArray(response)) {
            // Respuesta directa como array
            rawUsers = response;
            console.log('✅ Respuesta directa como array:', rawUsers.length);
          } else {
            console.error('❌ Formato de respuesta no reconocido:', response);
            console.log('🔧 Intentando extraer de diferentes formatos...');

            // Intentar otros formatos posibles
            if (response?.users) rawUsers = response.users;
            else if (response?.items) rawUsers = response.items;
            else rawUsers = [];
          }

          // Transformar y asignar
          this.users = rawUsers.map(user => this.transformApiUserToFrontend(user));
          this.filteredUsers = [...this.users];

          console.log('Usuarios transformados correctamente:', this.users.length);
          console.log('Primera muestra:', this.users.slice(0, 2));

          // Actualizar vista
          this.updatePagination();
          this.renderUsersTable();

        } catch (error) {
          console.error('Error procesando respuesta:', error);
          this.showErrorMessage('Error al procesar los datos de usuarios');
          this.users = [];
          this.filteredUsers = [];
        } finally {
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error cargando usuarios:', error);

        let errorMsg = 'Error al cargar usuarios';
        if (error.status === 0) {
          errorMsg = 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose.';
        } else if (error.status === 404) {
          errorMsg = 'Endpoint no encontrado. Verifica la ruta de la API.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }

        this.showErrorMessage(errorMsg);
        this.users = [];
        this.filteredUsers = [];
        this.updatePagination();
        this.renderUsersTable();
        this.isLoading = false;
      }
    });
  }

  // ========================================
  // CREACIÓN DE USUARIOS - CORREGIDO
  // ========================================

  private createNewUser(formData: UserFormData): void {
    console.log('🚀 Iniciando creación de usuario...');

    const apiData = this.transformFormDataToApiRequest(formData);
    console.log('📤 Datos enviados a la API:', apiData);

    this.usersService.create(apiData).subscribe({
      next: (response: any) => {
        try {
          console.log('✅ Usuario creado exitosamente:', response);

          this.showSuccessMessage('Usuario creado exitosamente');
          this.resetCreateUserForm();

          // FORZAR RECARGA INMEDIATA - SOLUCION TEMPORAL
          console.log('🔄 Forzando recarga de usuarios...');
          setTimeout(() => {
            this.loadAllUsers();

            // Si estamos en vista de lista, cambiar para forzar actualización visual
            if (this.currentView === 'list-users') {
              this.renderUsersTable();
            }
          }, 1000);

        } catch (error) {
          console.error('❌ Error procesando respuesta de creación:', error);
          this.showErrorMessage('Usuario creado pero hubo un error actualizando la lista');

          // Recargar de todos modos
          setTimeout(() => {
            this.loadAllUsers();
          }, 1000);
        } finally {
          this.isLoading = false;
          this.updateButtonState(false);
        }
      },
      error: (error: any) => {
        console.error('Error al crear usuario:', error);
        const errorMessage = this.parseCreateUserError(error);
        this.showErrorMessage(errorMessage);
        this.isLoading = false;
        this.updateButtonState(false);
      }
    });
  }

  // ========================================
  // EDICIÓN DE USUARIOS - FUNCIONALIDAD COMPLETA
  // ========================================

  /**
   * NUEVO: Cargar datos del usuario para edición
   */
  editUser(userId: string | number): void {
    console.log('Editando usuario:', userId);

    const user = this.users.find(u => u.id.toString() === userId.toString());
    if (!user) {
      this.showErrorMessage('Usuario no encontrado');
      return;
    }

    // Cambiar a modo edición
    this.isEditMode = true;
    this.editingUserId = userId;

    // Cargar datos en el formulario
    this.loadUserDataIntoForm(user);

    // Cambiar a vista de creación/edición
    this.toggleView('create-user-section');

    // Actualizar texto del botón
    this.updateButtonState(false, 'Actualizar usuario');

    this.showSuccessMessage(`Editando usuario: ${user.name}`);
  }

  /**
   * NUEVO: Cargar datos del usuario en el formulario
   */
  private loadUserDataIntoForm(user: User): void {
    // Separar nombre y apellidos
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Mapear tipo de documento
    let documentType = 'cedula';
    if (user.documentType.toLowerCase().includes('extranjería')) {
      documentType = 'pasaporte';
    } else if (user.documentType.toLowerCase().includes('tarjeta')) {
      documentType = 'tarjeta';
    }

    // Llenar formulario DOM
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) {
      (document.getElementById('documentType') as HTMLSelectElement).value = documentType;
      (document.getElementById('documentNumber') as HTMLInputElement).value = user.documentNumber;
      (document.getElementById('name') as HTMLInputElement).value = user.name;
      (document.getElementById('birthDate') as HTMLInputElement).value = user.birthDate || '';
      (document.getElementById('phoneNumber') as HTMLInputElement).value = user.phoneNumber;
      (document.getElementById('email') as HTMLInputElement).value = user.email;
      (document.getElementById('userType') as HTMLSelectElement).value = user.userType;

      // Las contraseñas se dejan vacías en edición
      (document.getElementById('password') as HTMLInputElement).value = '';
      (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
    }

    // Actualizar formulario reactivo
    this.userForm.patchValue({
      documentType,
      documentNumber: user.documentNumber,
      name: user.name,
      birthDate: user.birthDate || '',
      phoneNumber: user.phoneNumber,
      email: user.email,
      userType: user.userType,
      password: '',
      confirmPassword: '',
      service: ''
    });
  }

  /**
   * NUEVO: Actualizar usuario existente
   */
  private updateExistingUser(userId: string | number, formData: UserFormData): void {
    console.log('Actualizando usuario:', userId);

    // Para edición, la contraseña es opcional
    const apiData = this.transformFormDataToApiRequest(formData, true);
    console.log('Datos de actualización:', apiData);

    this.usersService.update(userId, apiData).subscribe({
      next: (response: any) => {
        try {
          console.log('Usuario actualizado exitosamente:', response);

          // Recargar todos los usuarios
          this.loadAllUsers();

          this.showSuccessMessage('Usuario actualizado exitosamente');
          this.cancelEdit();

        } catch (error) {
          console.error('Error procesando actualización:', error);
          this.showErrorMessage('Usuario actualizado pero hubo un error actualizando la lista');
          this.loadAllUsers();
        } finally {
          this.isLoading = false;
          this.updateButtonState(false);
        }
      },
      error: (error: any) => {
        console.error('Error al actualizar usuario:', error);
        let msg = 'Error actualizando el usuario';
        if (error?.error) {
          if (typeof error.error === 'string') msg = error.error;
          else if (error.error.message) msg = error.error.message;
        }
        this.showErrorMessage(msg);
        this.isLoading = false;
        this.updateButtonState(false);
      }
    });
  }

  /**
   * NUEVO: Cancelar edición
   */
  cancelEdit(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.resetCreateUserForm();
    this.updateButtonState(false, 'Crear usuario');
  }

  // ========================================
  // TRANSFORMADORES DE DATOS - CORREGIDOS
  // ========================================

  private transformApiUserToFrontend(apiUser: ApiUserResponse): User {
    const transformedUser: User = {
      id: apiUser.id,
      name: `${apiUser.nombres || ''} ${apiUser.apellidos || ''}`.trim() || 'Sin nombre',
      documentType: apiUser.identificationType?.nombre || 'Sin tipo',
      documentNumber: apiUser.identificacion || 'Sin documento',
      birthDate: apiUser.nacimiento || '',
      phoneNumber: apiUser.celular || apiUser.telefono || 'Sin teléfono',
      email: apiUser.email || 'Sin email',
      userType: apiUser.role?.nombre || 'Sin rol',
      service: '',
      createdAt: apiUser.creado_en ? new Date(apiUser.creado_en) : new Date(),
      status: apiUser.status?.nombre === 'Activo' ? 'active' : 'inactive',
      address: apiUser.direccion || '',
      gender: apiUser.genero || 'O'
    };

    return transformedUser;
  }

  /**
   * CORREGIDO: Soporte para edición
   */
  private transformFormDataToApiRequest(formData: UserFormData, isEdit = false): ApiUserRequest {
    // Separar nombre completo
    const nameParts = formData.name.trim().split(' ');
    const nombres = nameParts[0] || '';
    const apellidos = nameParts.slice(1).join(' ') || 'Sin apellido';

    // Mapear tipo de documento
    let tipoIdentificacionId = 1;
    switch (formData.documentType) {
      case 'cedula':
        tipoIdentificacionId = 1;
        break;
      case 'pasaporte':
        tipoIdentificacionId = 2;
        break;
      case 'tarjeta':
        tipoIdentificacionId = 3;
        break;
    }

    // Mapear rol - CORREGIDO para coincidir con tu base de datos
    let rolId = 2;
    switch (formData.userType) {
      case 'Cliente':
        rolId = 2;
        break;
      case 'Admin':
        rolId = 1;
        break;
      case 'Empleado':
        rolId = 3;
        break;
    }

    const apiData: ApiUserRequest = {
      nombres,
      apellidos,
      email: formData.email,
      nacimiento: formData.birthDate || null,
      genero: 'O' as 'M' | 'F' | 'O',
      clave: formData.password,
      tipo_identificacion_id: tipoIdentificacionId,
      identificacion: formData.documentNumber,
      celular: formData.phoneNumber || null,
      telefono: null,
      direccion: null,
      terminos_condiciones: true,
      estados_id: 1,
      roles_id: rolId,
      negocios_id: null
    };

    // Si es edición y no hay contraseña, eliminar el campo
    if (isEdit && !formData.password) {
      delete (apiData as any).clave;
    }

    return apiData;
  }

  // ========================================
  // MANEJO DE FORMULARIO - CORREGIDO
  // ========================================

  /**
   * CORREGIDO: Maneja tanto creación como edición
   */
  onSubmit(): void {
    const formData = this.getFormDataFromDOM();

    // Validación especial para edición (contraseña opcional)
    if (this.isEditMode && !formData.password && !formData.confirmPassword) {
      formData.password = 'dummy-password'; // Se ignorará en el backend
      formData.confirmPassword = 'dummy-password';
    }

    if (this.validateFormData(formData)) {
      this.isLoading = true;
      this.clearMessages();
      this.updateButtonState(true);

      setTimeout(() => {
        if (this.isEditMode && this.editingUserId) {
          this.updateExistingUser(this.editingUserId, formData);
        } else {
          this.createNewUser(formData);
        }
      }, 500);
    }
  }

  private createUserForm(): FormGroup {
    return this.formBuilder.group({
      documentType: ['cedula', Validators.required],
      documentNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, this.ageValidator]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      userType: ['Cliente', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      service: ['']
    });
  }

  private ageValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < 18 ? { 'ageRequired': true } : null;
  }

  private getFormDataFromDOM(): UserFormData {
    return {
      documentType: (document.getElementById('documentType') as HTMLSelectElement)?.value || '',
      documentNumber: (document.getElementById('documentNumber') as HTMLInputElement)?.value || '',
      name: (document.getElementById('name') as HTMLInputElement)?.value || '',
      birthDate: (document.getElementById('birthDate') as HTMLInputElement)?.value || '',
      phoneNumber: (document.getElementById('phoneNumber') as HTMLInputElement)?.value || '',
      email: (document.getElementById('email') as HTMLInputElement)?.value || '',
      userType: (document.getElementById('userType') as HTMLSelectElement)?.value || '',
      password: (document.getElementById('password') as HTMLInputElement)?.value || '',
      confirmPassword: (document.getElementById('confirmPassword') as HTMLInputElement)?.value || '',
      service: (document.getElementById('service') as HTMLSelectElement)?.value || ''
    };
  }

  /**
   * CORREGIDO: Validación especial para edición
   */
  private validateFormData(formData: UserFormData): boolean {
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'service') return; // Opcional

      // En modo edición, contraseñas son opcionales
      if (this.isEditMode && (key === 'password' || key === 'confirmPassword')) {
        return;
      }

      const element = document.getElementById(key);
      const formGroup = element?.closest('.form-group');
      const errorDiv = formGroup?.querySelector('.error-message') as HTMLElement;

      if (!value && key !== 'confirmPassword') {
        isValid = false;
        this.showFieldError(formGroup, errorDiv, 'Este campo es requerido');
      } else {
        const fieldError = this.validateSpecificField(key, value);
        if (fieldError) {
          isValid = false;
          this.showFieldError(formGroup, errorDiv, fieldError);
        } else {
          this.clearFieldError(formGroup, errorDiv);
        }
      }
    });

    // Validar contraseñas solo si se proporcionan
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        isValid = false;
        const confirmPasswordGroup = document.getElementById('confirmPassword')?.closest('.form-group');
        const errorDiv = confirmPasswordGroup?.querySelector('.error-message') as HTMLElement;
        this.showFieldError(confirmPasswordGroup, errorDiv, 'Las contraseñas no coinciden');
      }
    }

    return isValid;
  }

  private validateSpecificField(key: string, value: string): string {
    switch (key) {
      case 'documentNumber':
        return !/^[0-9]+$/.test(value) ? 'Solo se permiten números' : '';
      case 'name':
        return value.length < 2 ? 'El nombre debe tener al menos 2 caracteres' : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Formato de email inválido' : '';
      case 'phoneNumber':
        return !/^[0-9+\-\s()]+$/.test(value) ? 'Formato de teléfono inválido' : '';
      case 'password':
        return value.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : '';
      case 'birthDate':
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        return age < 18 ? 'Debe ser mayor de 18 años' : '';
      default:
        return '';
    }
  }

  private resetCreateUserForm(): void {
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) {
      form.reset();

      const documentTypeSelect = document.getElementById('documentType') as HTMLSelectElement;
      if (documentTypeSelect) {
        documentTypeSelect.value = 'cedula';
      }

      const userTypeSelect = document.getElementById('userType') as HTMLSelectElement;
      if (userTypeSelect) {
        userTypeSelect.value = 'Cliente';
      }
    }

    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
      group.classList.remove('error');
      const errorMsg = group.querySelector('.error-message') as HTMLElement;
      if (errorMsg) {
        errorMsg.textContent = '';
      }
    });

    this.userForm.reset({
      documentType: 'cedula',
      userType: 'Cliente'
    });

    // Reset modo edición
    this.isEditMode = false;
    this.editingUserId = null;
  }

  /**
   * CORREGIDO: Soporte para texto dinámico del botón
   */
  private updateButtonState(loading: boolean, text?: string): void {
    const submitBtn = document.querySelector('.btn-create') as HTMLButtonElement;
    if (submitBtn) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = this.isEditMode ? 'Actualizando...' : 'Creando...';
      } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = text || (this.isEditMode ? 'Actualizar usuario' : 'Crear usuario');
      }
    }
  }

  // ========================================
  // FUNCIONALIDADES DE VISTA
  // ========================================

  toggleView(targetSection: string): void {
    const createSection = document.getElementById('create-user-section');
    const listSection = document.getElementById('list-users-section');

    if (targetSection === 'create-user-section') {
      this.currentView = 'create-user';
      createSection?.classList.add('active');
      listSection?.classList.remove('active');

      // Si no estamos en modo edición, limpiar formulario
      if (!this.isEditMode) {
        this.resetCreateUserForm();
      }

    } else if (targetSection === 'list-users-section') {
      this.currentView = 'list-users';
      createSection?.classList.remove('active');
      listSection?.classList.add('active');

      // Cancelar edición si estaba activa
      if (this.isEditMode) {
        this.cancelEdit();
      }

      this.refreshUsersList();
    }
  }

  refreshUsersList(): void {
    console.log('Refrescando lista de usuarios...');
    this.loadAllUsers();

    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    if (refreshBtn) {
      const originalText = refreshBtn.textContent;
      refreshBtn.textContent = 'Actualizando...';
      refreshBtn.disabled = true;

      setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
      }, 2000);
    }
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.documentNumber.includes(term) ||
        user.userType.toLowerCase().includes(term)
      );
    }

    this.currentPage = 1;
    this.updatePagination();
    this.renderUsersTable();
  }

  renderUsersTable(): void {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentUsers = this.filteredUsers.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (currentUsers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
            ${this.searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
          </td>
        </tr>
      `;
      return;
    }

    currentUsers.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.documentNumber}</td>
        <td>${user.userType}</td>
        <td>${user.phoneNumber}</td>
        <td>${user.email}</td>
        <td>
          <div class="actions-buttons">
            <button class="action-button" onclick="window.crearUsuarioComponent?.viewUser('${user.id}')">
              Ver
            </button>
            <button class="action-button" onclick="window.crearUsuarioComponent?.editUser('${user.id}')">
              Editar
            </button>
            <button class="action-button" onclick="window.crearUsuarioComponent?.deleteUser('${user.id}')">
              Eliminar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    this.updateUserCounter();
  }

  private updateUserCounter(): void {
    const counterElement = document.getElementById('userCounter');
    if (counterElement) {
      counterElement.textContent = `Total: ${this.users.length} usuarios`;
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);

    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextPage') as HTMLButtonElement;

    if (pageInfo) {
      pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = this.currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.renderUsersTable();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.renderUsersTable();
    }
  }

  // ========================================
  // ACCIONES DE USUARIO
  // ========================================

  viewUser(userId: string | number): void {
    console.log('Ver detalles del usuario:', userId);

    this.usersService.getById(userId).subscribe({
      next: (response: any) => {
        const user = this.transformApiUserToFrontend(response);
        this.showUserDetails(user);
      },
      error: (error: any) => {
        const errorMsg = error?.error?.message || 'No se pudo consultar el usuario';
        this.showErrorMessage(errorMsg);
      }
    });
  }

  private showUserDetails(user: User): void {
    const details = `
      Información del Usuario:
      - Nombre: ${user.name}
      - Documento: ${user.documentType} - ${user.documentNumber}
      - Email: ${user.email}
      - Teléfono: ${user.phoneNumber}
      - Tipo: ${user.userType}
      - Estado: ${user.status === 'active' ? 'Activo' : 'Inactivo'}
    `;

    alert(details); // Puedes reemplazar esto con un modal más elegante
  }

  deleteUser(userId: string | number): void {
    const user = this.users.find(u => u.id.toString() === userId.toString());
    if (!user) return;

    if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.name}"?`)) {
      this.usersService.delete(userId).subscribe({
        next: () => {
          // Recargar toda la lista después de eliminar
          this.loadAllUsers();
          this.showSuccessMessage('Usuario eliminado correctamente');
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Error al eliminar el usuario';
          this.showErrorMessage(errorMsg);
        }
      });
    }
  }

  // ========================================
  // GESTIÓN DE MENSAJES
  // ========================================

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.displayMessage(message, 'success');
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.displayMessage(message, 'error');
  }

  private displayMessage(message: string, type: 'success' | 'error'): void {
    let messageDiv = document.querySelector(`.${type}-message`) as HTMLElement;
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.className = `${type}-message`;
      const cardContent = document.querySelector('.card-content');
      if (cardContent) {
        cardContent.insertBefore(messageDiv, cardContent.firstChild);
      }
    }

    messageDiv.textContent = message;
    messageDiv.classList.add('show');

    setTimeout(() => {
      messageDiv.classList.remove('show');
    }, 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const successDiv = document.querySelector('.success-message') as HTMLElement;
    const errorDiv = document.querySelector('.error-message-global') as HTMLElement;

    if (successDiv) successDiv.classList.remove('show');
    if (errorDiv) errorDiv.classList.remove('show');
  }

  // ========================================
  // UTILIDADES
  // ========================================

  private parseCreateUserError(error: any): string {
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose en http://localhost:8000';
    }

    if (error.status === 404) {
      return 'Endpoint no encontrado. Verifica la URL: POST /api/users';
    }

    if (error.status === 422) {
      if (error.error?.errors) {
        const validationErrors = Object.entries(error.error.errors).map(([field, messages]) => {
          return `${field}: ${(messages as string[]).join(', ')}`;
        });
        return 'Errores de validación: ' + validationErrors.join(' | ');
      }
      return error.error?.message || 'Error de validación de datos';
    }

    if (error.status === 500) {
      return 'Error interno del servidor Laravel. Revisa los logs de Laravel.';
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return 'Error desconocido al crear el usuario.';
  }

  private showFieldError(formGroup: Element | null | undefined, errorDiv: HTMLElement | null, message: string): void {
    if (formGroup) {
      formGroup.classList.add('error');
    }
    if (errorDiv) {
      errorDiv.textContent = message;
    }
  }

  private clearFieldError(formGroup?: Element | null | undefined, errorDiv?: HTMLElement | null): void {
    if (formGroup) {
      formGroup.classList.remove('error');
    }
    if (errorDiv) {
      errorDiv.textContent = '';
    }
  }

  // ========================================
  // FUNCIONES DE DEPURACIÓN
  // ========================================

  debugCurrentState(): void {
    console.log('Estado actual del componente:');
    console.log('   - Vista actual:', this.currentView);
    console.log('   - Modo edición:', this.isEditMode);
    console.log('   - Usuario editando:', this.editingUserId);
    console.log('   - Total usuarios:', this.users.length);
    console.log('   - Usuarios filtrados:', this.filteredUsers.length);
    console.log('   - Página actual:', this.currentPage);
    console.log('   - Término de búsqueda:', this.searchTerm);
    console.log('   - Cargando:', this.isLoading);
  }
}
