import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminWeb } from "../admin-web";
import { UsersService } from '../../../services/users.service';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';

// ========================================
// INTERFACES PARA TIPADO FUERTE
// ========================================

/**
 * Interfaz para la respuesta de la API Laravel
 * Mapea exactamente los campos que devuelve el backend
 */
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
  // Relaciones cargadas con eager loading
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

/**
 * Interfaz para los datos del usuario en el frontend
 * Estructura normalizada para uso en la aplicación
 */
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

/**
 * Interfaz para los datos del formulario de creación
 * Mapea a los campos que espera la API Laravel
 */
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

/**
 * Interfaz para los datos que se envían a la API
 * Coincide exactamente con los campos esperados por Laravel
 */
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

  // Edición (para futuras funcionalidades)
  editingUserId: number | string | null = null;

  // ========================================
  // DATOS MAESTROS PARA LOS FORMULARIOS
  // ========================================

  documentTypes = [
    { value: '', label: 'Seleccione el tipo' },
    { value: 'cedula', label: 'Cédula' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'tarjeta', label: 'Tarjeta de identidad' }
  ];

  userTypes = [
    { value: 'Cliente', label: 'Cliente' },
    { value: 'Administrador', label: 'Administrador' },
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
  // CICLO DE VIDA DEL COMPONENTE
  // ========================================

  ngOnInit(): void {
    this.initializeComponent();
    this.loadAllUsers(); // Cargar usuarios al inicializar
  }

  ngAfterViewInit(): void {
    // Hacer la instancia accesible globalmente para eventos del DOM
    (window as any).crearUsuarioComponent = this;
    // Configurar eventos después de que la vista esté renderizada
    setTimeout(() => {
      this.setupDOMEvents();
    }, 100);
  }

  ngOnDestroy(): void {
    // Limpiar referencia global
    if ((window as any).crearUsuarioComponent === this) {
      delete (window as any).crearUsuarioComponent;
    }
  }

  // ========================================
  // INICIALIZACIÓN Y CONFIGURACIÓN
  // ========================================

  private initializeComponent(): void {
    this.userForm = this.createUserForm();
  }

  /**
   * Configurar eventos del DOM
   * Maneja la interacción con elementos HTML nativos
   */
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

      // Evento para el formulario de creación
      const form = document.getElementById('userForm') as HTMLFormElement;
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.onSubmit();
        });
      }

      // Evento para búsqueda en la lista
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

      // Configurar validación en tiempo real
      this.setupFormValidation();

      console.log('✅ Eventos del DOM configurados correctamente');
    } catch (error) {
      console.warn('⚠️ Error configurando eventos del DOM:', error);
    }
  }

  /**
   * Configurar validación del formulario en tiempo real
   */
  private setupFormValidation(): void {
    const fields = ['documentType', 'documentNumber', 'name', 'birthDate', 'phoneNumber', 'email', 'userType', 'password', 'confirmPassword'];

    fields.forEach(fieldName => {
      const element = document.getElementById(fieldName) as HTMLInputElement;
      if (element) {
        element.addEventListener('blur', () => this.validateField(fieldName));
        element.addEventListener('input', () => {
          const formGroup = element.closest('.form-group');
          this.clearFieldError(formGroup);
        });
      }
    });
  }

  // ========================================
  // 1. CONSULTA DE DATOS - GET /api/users
  // ========================================

  /**
   * Cargar todos los usuarios desde la API
   * Endpoint: GET /api/users
   */
  private loadAllUsers(): void {
    this.isLoading = true;

    this.usersService.getAll().subscribe({
      next: (response: any) => {
        try {
          console.log('📋 Respuesta de la API (usuarios):', response);

          // Manejar diferentes formatos de respuesta de Laravel
          let rawUsers: ApiUserResponse[] = [];

          if (Array.isArray(response)) {
            // Respuesta directa como array
            rawUsers = response;
          } else if (response && Array.isArray(response.data)) {
            // Respuesta con estructura { data: [...] }
            rawUsers = response.data;
          } else if (response && response.current_page) {
            // Respuesta paginada de Laravel
            rawUsers = response.data || [];
          }

          console.log('🔍 Usuarios en formato API:', rawUsers);

          // Transformar datos de la API al formato del frontend
          this.users = rawUsers.map(user => this.transformApiUserToFrontend(user));
          this.filteredUsers = [...this.users];

          console.log('✅ Usuarios transformados para el frontend:', this.users);

          // Actualizar la vista
          this.updatePagination();
          this.renderUsersTable();

        } catch (error) {
          console.error('❌ Error procesando respuesta de usuarios:', error);
          this.showErrorMessage('Error al procesar los datos de usuarios');
        } finally {
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('❌ Error cargando usuarios:', error);
        let errorMsg = 'Error al cargar usuarios desde la API';

        if (error.status === 0) {
          errorMsg = 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose.';
        } else if (error.status === 404) {
          errorMsg = 'Endpoint de usuarios no encontrado. Verifica la ruta de la API.';
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

  /**
   * Consultar un usuario individual por ID
   * Endpoint: GET /api/users/{id}
   */
  getUserById(id: number | string): void {
    this.usersService.getById(id).subscribe({
      next: (response: any) => {
        try {
          const user = this.transformApiUserToFrontend(response);
          console.log('👤 Usuario consultado por ID:', user);

          // Aquí puedes implementar lógica adicional para mostrar el usuario
          // Por ejemplo, abrir un modal con los detalles
          this.showUserDetails(user);

        } catch (error) {
          console.error('❌ Error procesando usuario individual:', error);
          this.showErrorMessage('Error al procesar los datos del usuario');
        }
      },
      error: (error: any) => {
        console.error('❌ Error consultando usuario por ID:', error);
        const errorMsg = error?.error?.message || 'No se pudo consultar el usuario';
        this.showErrorMessage(errorMsg);
      }
    });
  }

  // ========================================
  // 2. REGISTRO DE DATOS - POST /api/users
  // ========================================

  /**
   * Crear nuevo usuario en el backend
   * Endpoint: POST /api/users
   * Incluye validación de errores y actualización de la lista local
   */
  private createNewUser(formData: UserFormData): void {
    console.log('🚀 Iniciando creación de usuario...');

    // Transformar datos del formulario al formato esperado por la API
    const apiData = this.transformFormDataToApiRequest(formData);
    console.log('📤 Datos enviados a la API:', apiData);

    this.usersService.create(apiData).subscribe({
      next: (response: any) => {
        try {
          console.log('✅ Usuario creado exitosamente:', response);

          // Transformar la respuesta al formato del frontend y agregar a la lista
          if (response) {
            const newUser = this.transformApiUserToFrontend(response);

            // Agregar al inicio de la lista local
            this.users.unshift(newUser);
            this.filteredUsers = [...this.users];

            // Actualizar vista
            this.updatePagination();
            this.renderUsersTable();

            console.log('📝 Lista actualizada. Total usuarios:', this.users.length);
          }

          this.showSuccessMessage('Usuario creado exitosamente');
          this.resetCreateUserForm();

        } catch (error) {
          console.error('❌ Error procesando respuesta de creación:', error);
          this.showErrorMessage('Usuario creado pero hubo un error actualizando la lista');
        } finally {
          this.isLoading = false;
          this.updateButtonState(false);
        }
      },
      error: (error: any) => {
        console.error('❌ Error completo al crear usuario:', error);

        // Manejo detallado de errores
        let errorMessage = this.parseCreateUserError(error);

        console.error('❌ Mensaje de error final:', errorMessage);
        this.showErrorMessage(errorMessage);
        this.isLoading = false;
        this.updateButtonState(false);
      }
    });
  }

  /**
   * Analizar y formatear errores de creación de usuario
   */

  /**
   * Actualizar usuario existente via API
   */
  updateExistingUser(userId: string | number, formData: UserFormData): void {
    console.log('🚀 Iniciando actualización de usuario...', userId);
    const apiData = this.transformFormDataToApiRequest(formData);

    this.usersService.update(userId, apiData).subscribe({
      next: (response: any) => {
        try {
          console.log('✅ Usuario actualizado:', response);

          // Actualizar la lista local de usuarios
          const index = this.users.findIndex(u => u.id.toString() === userId.toString());
          if (index !== -1) {
            const updatedUser = this.transformApiUserToFrontend(response);
            this.users[index] = updatedUser;
            this.filteredUsers = [...this.users];
            this.updatePagination();
            this.renderUsersTable();
            console.log('📝 Lista actualizada tras edición.');
          }

          this.showSuccessMessage('Usuario actualizado exitosamente');
          // Reset del formulario y modo edición
          this.resetCreateUserForm();
          this.editingUserId = null;
        } catch (error) {
          console.error('❌ Error procesando respuesta de actualización:', error);
          this.showErrorMessage('Usuario actualizado pero hubo un error actualizando la lista');
        } finally {
          this.isLoading = false;
          this.updateButtonState(false);
        }
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar usuario:', error);
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

private parseCreateUserError(error: any): string {
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose en http://localhost:8000';
    }

    if (error.status === 404) {
      return 'Endpoint no encontrado. Verifica la URL: POST /api/users';
    }

    if (error.status === 422) {
      // Errores de validación de Laravel
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

  // ========================================
  // 3. TRANSFORMADORES DE DATOS
  // ========================================

  /**
   * Transformar datos de la API Laravel al formato del frontend
   * Normaliza los campos para uso consistente en la aplicación
   */
  private transformApiUserToFrontend(apiUser: ApiUserResponse): User {
    console.log('🔄 Transformando usuario de API a frontend:', apiUser);

    const transformedUser: User = {
      id: apiUser.id,
      name: `${apiUser.nombres || ''} ${apiUser.apellidos || ''}`.trim() || 'Sin nombre',
      documentType: apiUser.identificationType?.nombre || 'Sin tipo',
      documentNumber: apiUser.identificacion || 'Sin documento',
      birthDate: apiUser.nacimiento || '',
      phoneNumber: apiUser.celular || apiUser.telefono || 'Sin teléfono',
      email: apiUser.email || 'Sin email',
      userType: apiUser.role?.nombre || 'Sin rol',
      service: '', // Campo específico del frontend
      createdAt: apiUser.creado_en ? new Date(apiUser.creado_en) : new Date(),
      status: apiUser.status?.nombre === 'Activo' ? 'active' : 'inactive',
      address: apiUser.direccion || '',
      gender: apiUser.genero || 'O'
    };

    console.log('✅ Usuario transformado:', transformedUser);
    return transformedUser;
  }

  /**
   * Transformar datos del formulario al formato esperado por la API Laravel
   * Mapea campos del frontend a la estructura exacta que espera el backend
   */
  private transformFormDataToApiRequest(formData: UserFormData): ApiUserRequest {
    // Separar nombre completo en nombres y apellidos
    const nameParts = formData.name.trim().split(' ');
    const nombres = nameParts[0] || '';
    const apellidos = nameParts.slice(1).join(' ') || 'Sin apellido';

    // Mapear tipo de documento a ID según la base de datos
    let tipoIdentificacionId = 1; // Por defecto Cédula de Ciudadanía
    switch (formData.documentType) {
      case 'cedula':
        tipoIdentificacionId = 1; // 'Cédula de Ciudadanía'
        break;
      case 'pasaporte':
        tipoIdentificacionId = 2; // 'Cédula de Extranjería'
        break;
      case 'tarjeta':
        tipoIdentificacionId = 3; // 'Tarjeta de Identidad'
        break;
    }

    // Mapear tipo de usuario a ID de rol según la base de datos
    let rolId = 2; // Por defecto Cliente
    switch (formData.userType) {
      case 'Cliente':
        rolId = 2; // 'Cliente' tiene ID 2
        break;
      case 'Administrador':
        rolId = 1; // 'Admin' tiene ID 1
        break;
      case 'Empleado':
        rolId = 3; // 'Empleado' tiene ID 3
        break;
    }

    const apiData: ApiUserRequest = {
      nombres,
      apellidos,
      email: formData.email,
      nacimiento: formData.birthDate || null,
      genero: 'O' as 'M' | 'F' | 'O', // Por defecto 'Otro'
      clave: formData.password,
      tipo_identificacion_id: tipoIdentificacionId,
      identificacion: formData.documentNumber,
      celular: formData.phoneNumber || null,
      telefono: null,
      direccion: null,
      terminos_condiciones: true,
      estados_id: 1, // 'Activo' tiene ID 1
      roles_id: rolId,
      negocios_id: null // NULL para usuarios generales
    };

    console.log('🔍 Mapeo de formulario a API:');
    console.log('   - Documento:', formData.documentType, '=>', tipoIdentificacionId);
    console.log('   - Rol:', formData.userType, '=>', rolId);
    console.log('   - Datos finales:', apiData);

    return apiData;
  }

  // ========================================
  // 4. DIVISIÓN DE VISTAS - GESTIÓN DE COMPONENTES
  // ========================================

  /**
   * Alternar entre la vista de crear usuario y listar usuarios
   * Método principal para la división de vistas
   */
  toggleView(targetSection: string): void {
    const createSection = document.getElementById('create-user-section');
    const listSection = document.getElementById('list-users-section');

    if (targetSection === 'create-user-section') {
      this.currentView = 'create-user';
      createSection?.classList.add('active');
      listSection?.classList.remove('active');

      console.log('📝 Cambiando a vista de crear usuario');

    } else if (targetSection === 'list-users-section') {
      this.currentView = 'list-users';
      createSection?.classList.remove('active');
      listSection?.classList.add('active');

      console.log('📋 Cambiando a vista de listar usuarios');

      // Refrescar usuarios al cambiar a la vista de lista
      this.refreshUsersList();
    }
  }

  /**
   * Refrescar lista de usuarios manualmente
   * Utilizado principalmente en la vista de listado
   */
  refreshUsersList(): void {
    console.log('🔄 Refrescando lista de usuarios...');
    this.loadAllUsers();

    // Indicador visual de actualización
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

  // ========================================
  // FORMULARIO REACTIVO - VISTA CREAR USUARIO
  // ========================================

  /**
   * Crear formulario reactivo con validaciones
   * Para la vista de crear usuario
   */
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
      service: [''] // Opcional
    });
  }

  /**
   * Validador personalizado para edad mínima (18 años)
   */
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

  /**
   * Manejar envío del formulario de creación
   */
  onSubmit(): void {
    const formData = this.getFormDataFromDOM();

    if (this.validateFormData(formData)) {
      this.isLoading = true;
      this.clearMessages();
      this.updateButtonState(true);

      // Crear usuario con un pequeño delay para UX
      setTimeout(() => {
        this.createNewUser(formData);
      }, 500);
    }
  }

  /**
   * Obtener datos del formulario desde el DOM
   */
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
   * Validar datos del formulario
   */
  private validateFormData(formData: UserFormData): boolean {
    let isValid = true;

    // Validar cada campo requerido
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'service') return; // Opcional

      const element = document.getElementById(key);
      const formGroup = element?.closest('.form-group');
      const errorDiv = formGroup?.querySelector('.error-message') as HTMLElement;

      if (!value && key !== 'confirmPassword') {
        isValid = false;
        this.showFieldError(formGroup, errorDiv, 'Este campo es requerido');
      } else {
        // Validaciones específicas
        const fieldError = this.validateSpecificField(key, value);
        if (fieldError) {
          isValid = false;
          this.showFieldError(formGroup, errorDiv, fieldError);
        } else {
          this.clearFieldError(formGroup, errorDiv);
        }
      }
    });

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      isValid = false;
      const confirmPasswordGroup = document.getElementById('confirmPassword')?.closest('.form-group');
      const errorDiv = confirmPasswordGroup?.querySelector('.error-message') as HTMLElement;
      this.showFieldError(confirmPasswordGroup, errorDiv, 'Las contraseñas no coinciden');
    }

    return isValid;
  }

  /**
   * Validar campo específico
   */
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

  /**
   * Mostrar error en campo específico
   */
  private showFieldError(formGroup: Element | null | undefined, errorDiv: HTMLElement | null, message: string): void {
    if (formGroup) {
      formGroup.classList.add('error');
    }
    if (errorDiv) {
      errorDiv.textContent = message;
    }
  }

  /**
   * Limpiar error en campo específico
   */
  private clearFieldError(formGroup?: Element | null | undefined, errorDiv?: HTMLElement | null): void {
    if (formGroup) {
      formGroup.classList.remove('error');
    }
    if (errorDiv) {
      errorDiv.textContent = '';
    }
  }

  /**
   * Validar campo individual en tiempo real
   */
  private validateField(fieldName: string): void {
    const control = this.userForm.get(fieldName);
    const element = document.getElementById(fieldName);
    const formGroup = element?.closest('.form-group');
    const errorDiv = formGroup?.querySelector('.error-message') as HTMLElement;

    if (control && element) {
      let elementValue = '';
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
        elementValue = element.value || '';
      }

      control.setValue(elementValue);
      control.markAsTouched();

      if (control.invalid) {
        this.showFieldError(formGroup, errorDiv, this.getFieldErrorMessage(fieldName, control));
      } else {
        this.clearFieldError(formGroup, errorDiv);
      }
    }

    // Validar confirmación de contraseña
    if (fieldName === 'confirmPassword' || fieldName === 'password') {
      this.validatePasswordMatch();
    }
  }

  /**
   * Validar coincidencia de contraseñas
   */
  private validatePasswordMatch(): void {
    const password = (document.getElementById('password') as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
    const confirmPasswordGroup = document.getElementById('confirmPassword')?.closest('.form-group');
    const errorDiv = confirmPasswordGroup?.querySelector('.error-message') as HTMLElement;

    if (password && confirmPassword && password !== confirmPassword) {
      this.showFieldError(confirmPasswordGroup, errorDiv, 'Las contraseñas no coinciden');
    } else if (password && confirmPassword && password === confirmPassword) {
      this.clearFieldError(confirmPasswordGroup, errorDiv);
    }
  }

  /**
   * Obtener mensaje de error específico para cada campo
   */
  private getFieldErrorMessage(fieldName: string, control: AbstractControl): string {
    const errors = control.errors;
    if (!errors) return '';

    switch (fieldName) {
      case 'documentType':
        return errors['required'] ? 'Seleccione un tipo de documento' : '';
      case 'documentNumber':
        if (errors['required']) return 'Ingrese el número de documento';
        if (errors['pattern']) return 'Solo se permiten números';
        return '';
      case 'name':
        if (errors['required']) return 'Ingrese el nombre completo';
        if (errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
        return '';
      case 'birthDate':
        if (errors['required']) return 'Seleccione la fecha de nacimiento';
        if (errors['ageRequired']) return 'Debe ser mayor de 18 años';
        return '';
      case 'phoneNumber':
        if (errors['required']) return 'Ingrese el número de teléfono';
        if (errors['pattern']) return 'Formato de teléfono inválido';
        return '';
      case 'email':
        if (errors['required']) return 'Ingrese el email';
        if (errors['email']) return 'Formato de email inválido';
        return '';
      case 'userType':
        return errors['required'] ? 'Seleccione el tipo de usuario' : '';
      case 'password':
        if (errors['required']) return 'Ingrese la contraseña';
        if (errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
        return '';
      case 'confirmPassword':
        return errors['required'] ? 'Confirme la contraseña' : '';
      default:
        return 'Campo requerido';
    }
  }

  /**
   * Resetear formulario después de crear usuario
   */
  private resetCreateUserForm(): void {
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) {
      form.reset();

      // Restaurar valores por defecto válidos
      const documentTypeSelect = document.getElementById('documentType') as HTMLSelectElement;
      if (documentTypeSelect) {
        documentTypeSelect.value = 'cedula';
      }

      const userTypeSelect = document.getElementById('userType') as HTMLSelectElement;
      if (userTypeSelect) {
        userTypeSelect.value = 'Cliente';
      }
    }

    // Limpiar errores visuales
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
      group.classList.remove('error');
      const errorMsg = group.querySelector('.error-message') as HTMLElement;
      if (errorMsg) {
        errorMsg.textContent = '';
      }
    });

    // Resetear formulario reactivo con valores por defecto
    this.userForm.reset({
      documentType: 'cedula',
      userType: 'Cliente'
    });
  }

  /**
   * Actualizar estado del botón de envío
   */
  private updateButtonState(loading: boolean): void {
    const submitBtn = document.querySelector('.btn-create') as HTMLButtonElement;
    if (submitBtn) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Creando...';
      } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Crear usuario';
      }
    }
  }

  // ========================================
  // FUNCIONALIDADES DE LA LISTA - VISTA LISTAR USUARIOS
  // ========================================

  /**
   * Filtrar usuarios basado en el término de búsqueda
   * Para la vista de listado
   */
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

  /**
   * Renderizar tabla de usuarios con paginación
   * Función principal para alimentar la vista de listado
   */
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
      const statusIndicator = user.status === 'active' ?
        '<span class="status-dot status-active"></span>Activo' :
        '<span class="status-dot status-inactive"></span>Inactivo';

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

  /**
   * Actualizar contador de usuarios
   */
  private updateUserCounter(): void {
    const counterElement = document.getElementById('userCounter');
    if (counterElement) {
      counterElement.textContent = `Total: ${this.users.length} usuarios`;
    }
  }

  // ========================================
  // PAGINACIÓN - PARA VISTA DE LISTADO
  // ========================================

  /**
   * Actualizar información de paginación
   */
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

  /**
   * Ir a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.renderUsersTable();
    }
  }

  /**
   * Ir a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.renderUsersTable();
    }
  }

  // ========================================
  // ACCIONES DE USUARIO - PARA VISTA DE LISTADO
  // ========================================

  /**
   * Ver detalles de un usuario específico
   * Utiliza la consulta por ID implementada anteriormente
   */
  viewUser(userId: string | number): void {
    console.log('Ver detalles del usuario:', userId);
    this.getUserById(userId);
  }

  /**
   * Mostrar detalles del usuario (implementación básica)
   */
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

    alert(details); // Implementación básica - puedes reemplazar con un modal
  }

  /**
   * Editar usuario existente (funcionalidad futura)
   */
  editUser(userId: string | number): void {
    console.log('Editando usuario:', userId);
    this.editingUserId = userId;

    const user = this.users.find(u => u.id.toString() === userId.toString());
    if (user) {
      this.showSuccessMessage(`Función de editar usuario "${user.name}" estará disponible próximamente`);
    }
  }

  /**
   * Eliminar usuario (con confirmación)
   * Actualiza la lista local inmediatamente
   */
  deleteUser(userId: string | number): void {
    const user = this.users.find(u => u.id.toString() === userId.toString());
    if (!user) return;

    if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.name}"?`)) {
      this.usersService.delete(userId).subscribe({
        next: () => {
          // Actualizar la lista local inmediatamente
          this.users = this.users.filter(u => u.id.toString() !== userId.toString());
          this.filteredUsers = this.filteredUsers.filter(u => u.id.toString() !== userId.toString());

          // Actualizar la vista
          this.updatePagination();
          this.renderUsersTable();

          console.log('Usuario eliminado. Total usuarios:', this.users.length);
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
  // GESTIÓN DE MENSAJES - PARA AMBAS VISTAS
  // ========================================

  /**
   * Mostrar mensaje de éxito
   */
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.displayMessage(message, 'success');
  }

  /**
   * Mostrar mensaje de error
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.displayMessage(message, 'error');
  }

  /**
   * Mostrar mensaje en la interfaz
   */
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

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      messageDiv.classList.remove('show');
    }, 5000);
  }

  /**
   * Limpiar todos los mensajes
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const successDiv = document.querySelector('.success-message') as HTMLElement;
    const errorDiv = document.querySelector('.error-message-global') as HTMLElement;

    if (successDiv) successDiv.classList.remove('show');
    if (errorDiv) errorDiv.classList.remove('show');
  }

  // ========================================
  // UTILIDADES Y FUNCIONES AUXILIARES
  // ========================================

  /**
   * Exportar lista de usuarios (funcionalidad futura)
   */
  exportUsers(): void {
    console.log('Exportando usuarios...', this.filteredUsers);
    this.showSuccessMessage('Funcionalidad de exportación estará disponible próximamente');
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getUserStats(): { total: number, active: number, inactive: number, byRole: Record<string, number> } {
    const stats = {
      total: this.users.length,
      active: this.users.filter(u => u.status === 'active').length,
      inactive: this.users.filter(u => u.status === 'inactive').length,
      byRole: {} as Record<string, number>
    };

    // Contar por rol
    this.users.forEach(user => {
      stats.byRole[user.userType] = (stats.byRole[user.userType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Verificar si email ya existe
   */
  private checkIfEmailExists(email: string): boolean {
    return this.users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Verificar si documento ya existe
   */
  private checkIfDocumentExists(documentNumber: string): boolean {
    return this.users.some(user => user.documentNumber === documentNumber);
  }

  /**
   * Formatear fecha para mostrar en la interfaz
   */
  private formatDate(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Validar email con regex
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Limpiar y normalizar texto
   */
  private sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Verificar si el usuario es mayor de edad
   */
  private isOfAge(birthDate: string): boolean {
    if (!birthDate) return false;

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 18;
  }

  // ========================================
  // FUNCIONES DE DEBUGGING Y MONITOREO
  // ========================================

  /**
   * Función de debugging para inspeccionar el estado actual
   */
  debugCurrentState(): void {
    console.log('Estado actual del componente:');
    console.log('   - Vista actual:', this.currentView);
    console.log('   - Total usuarios:', this.users.length);
    console.log('   - Usuarios filtrados:', this.filteredUsers.length);
    console.log('   - Página actual:', this.currentPage);
    console.log('   - Término de búsqueda:', this.searchTerm);
    console.log('   - Cargando:', this.isLoading);
    console.log('   - Lista completa:', this.users);
  }

  /**
   * Verificar sincronización con el backend
   */
  async verifySyncWithBackend(): Promise<void> {
    console.log('Verificando sincronización con backend...');

    try {
      this.usersService.getAll().subscribe({
        next: (backendUsers: any) => {
          const backendCount = Array.isArray(backendUsers) ? backendUsers.length : backendUsers?.data?.length || 0;
          const frontendCount = this.users.length;

          console.log('Comparación de datos:');
          console.log('   - Backend:', backendCount, 'usuarios');
          console.log('   - Frontend:', frontendCount, 'usuarios');

          if (backendCount === frontendCount) {
            console.log('Sincronización correcta');
          } else {
            console.log('Desincronización detectada - Recargando datos...');
            this.loadAllUsers();
          }
        },
        error: (error) => {
          console.error('Error en verificación:', error);
        }
      });
    } catch (error) {
      console.error('Error en verificación async:', error);
    }
  }
}
