import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminWeb } from "../admin-web";

// Interfaces para tipado fuerte
interface User {
  id: string;
  documentType: string;
  documentNumber: string;
  name: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  userType: string;
  service?: string;
  createdAt: Date;
  status: 'active' | 'inactive';
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

@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AdminWeb]
})
export class CrearUsuarioComponent implements OnInit, AfterViewInit, OnDestroy {

  // Propiedades del formulario
  userForm: FormGroup;
  isLoading = false;

  // Propiedades para la vista activa
  currentView: 'create-user' | 'list-users' = 'create-user';

  // Propiedades para la lista de usuarios
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';

  // Propiedades para paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Mensajes
  successMessage = '';
  errorMessage = '';

  // Opciones para los selectores
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

  constructor(private formBuilder: FormBuilder) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadUsers();
  }

  // Inicialización del componente
  private initializeComponent(): void {
    setTimeout(() => {
      this.setupDOMEvents();
    }, 0);
  }

  // Configurar eventos del DOM
  private setupDOMEvents(): void {
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

    // Eventos para validación en tiempo real
    this.setupFormValidation();
  }

  // Configurar validación del formulario
  private setupFormValidation(): void {
    const fields = ['documentType', 'documentNumber', 'name', 'birthDate', 'phoneNumber', 'email', 'userType', 'password', 'confirmPassword'];

    fields.forEach(fieldName => {
      const element = document.getElementById(fieldName) as HTMLInputElement;
      if (element) {
        element.addEventListener('blur', () => this.validateField(fieldName));
        element.addEventListener('input', () => this.clearFieldError(fieldName));
      }
    });
  }

  // Validar campo individual
  private validateField(fieldName: string): void {
    const control = this.userForm.get(fieldName);
    const element = document.getElementById(fieldName);
    const formGroup = element?.closest('.form-group');
    const errorDiv = formGroup?.querySelector('.error-message') as HTMLElement;

    if (control && element) {
      // Actualizar el valor del control con el valor del DOM
      // Corrección: Cast el elemento al tipo correcto para acceder a 'value'
      let elementValue = '';
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
        elementValue = element.value || '';
      }

      control.setValue(elementValue);
      control.markAsTouched();

      if (control.invalid) {
        formGroup?.classList.add('error');
        if (errorDiv) {
          errorDiv.textContent = this.getFieldErrorMessage(fieldName, control);
        }
      } else {
        formGroup?.classList.remove('error');
        if (errorDiv) {
          errorDiv.textContent = '';
        }
      }
    }

    // Validar confirmación de contraseña
    if (fieldName === 'confirmPassword' || fieldName === 'password') {
      this.validatePasswordMatch();
    }
  }

  // Limpiar error de campo
  private clearFieldError(fieldName: string): void {
    const element = document.getElementById(fieldName);
    const formGroup = element?.closest('.form-group');
    formGroup?.classList.remove('error');
  }

  // Validar coincidencia de contraseñas
  private validatePasswordMatch(): void {
    const password = (document.getElementById('password') as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
    const confirmPasswordGroup = document.getElementById('confirmPassword')?.closest('.form-group');
    const errorDiv = confirmPasswordGroup?.querySelector('.error-message') as HTMLElement;

    if (password && confirmPassword && password !== confirmPassword) {
      confirmPasswordGroup?.classList.add('error');
      if (errorDiv) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
      }
    } else if (password && confirmPassword && password === confirmPassword) {
      confirmPasswordGroup?.classList.remove('error');
      if (errorDiv) {
        errorDiv.textContent = '';
      }
    }
  }

  // Crear formulario reactivo
  private createUserForm(): FormGroup {
    return this.formBuilder.group({
      documentType: ['', Validators.required],
      documentNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, this.ageValidator]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      userType: ['Empleado', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      service: ['']
    });
  }

  // Validador personalizado para edad mínima
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

  // Alternar entre vistas
  toggleView(targetSection: string): void {
    const createSection = document.getElementById('create-user-section');
    const listSection = document.getElementById('list-users-section');

    if (targetSection === 'create-user-section') {
      this.currentView = 'create-user';
      createSection?.classList.add('active');
      listSection?.classList.remove('active');
    } else if (targetSection === 'list-users-section') {
      this.currentView = 'list-users';
      createSection?.classList.remove('active');
      listSection?.classList.add('active');
      this.loadUsers();
    }
  }

  // Obtener datos del formulario del DOM
  private getFormData(): UserFormData {
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

  // Validar formulario
  private validateForm(formData: UserFormData): boolean {
    let isValid = true;

    // Validar cada campo
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'service') return; // El servicio es opcional

      const element = document.getElementById(key);
      const formGroup = element?.closest('.form-group');
      const errorDiv = formGroup?.querySelector('.error-message') as HTMLElement;

      if (!value && key !== 'confirmPassword') {
        isValid = false;
        formGroup?.classList.add('error');
        if (errorDiv) {
          errorDiv.textContent = 'Este campo es requerido';
        }
      } else {
        // Validaciones específicas
        let fieldError = '';

        switch (key) {
          case 'documentNumber':
            if (!/^[0-9]+$/.test(value)) {
              fieldError = 'Solo se permiten números';
              isValid = false;
            }
            break;
          case 'name':
            if (value.length < 2) {
              fieldError = 'El nombre debe tener al menos 2 caracteres';
              isValid = false;
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              fieldError = 'Formato de email inválido';
              isValid = false;
            }
            break;
          case 'phoneNumber':
            if (!/^[0-9+\-\s()]+$/.test(value)) {
              fieldError = 'Formato de teléfono inválido';
              isValid = false;
            }
            break;
          case 'password':
            if (value.length < 6) {
              fieldError = 'La contraseña debe tener al menos 6 caracteres';
              isValid = false;
            }
            break;
          case 'birthDate':
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            if (age < 18) {
              fieldError = 'Debe ser mayor de 18 años';
              isValid = false;
            }
            break;
        }

        if (fieldError) {
          formGroup?.classList.add('error');
          if (errorDiv) {
            errorDiv.textContent = fieldError;
          }
        } else {
          formGroup?.classList.remove('error');
          if (errorDiv) {
            errorDiv.textContent = '';
          }
        }
      }
    });

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      isValid = false;
      const confirmPasswordGroup = document.getElementById('confirmPassword')?.closest('.form-group');
      const errorDiv = confirmPasswordGroup?.querySelector('.error-message') as HTMLElement;
      confirmPasswordGroup?.classList.add('error');
      if (errorDiv) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
      }
    }

    return isValid;
  }

  // Envío del formulario
  onSubmit(): void {
    const formData = this.getFormData();

    if (this.validateForm(formData)) {
      this.isLoading = true;
      this.clearMessages();
      this.updateButtonState(true);

      setTimeout(() => {
        this.createUser(formData);
      }, 1000);
    }
  }

  // Actualizar estado del botón
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

  // Crear nuevo usuario
  private createUser(formData: UserFormData): void {
    try {
      // Verificar si el usuario ya existe
      const existingUser = this.users.find(user =>
        user.documentNumber === formData.documentNumber || user.email === formData.email
      );

      if (existingUser) {
        this.showErrorMessage('Ya existe un usuario con este documento o email');
        this.isLoading = false;
        this.updateButtonState(false);
        return;
      }

      // Crear nuevo usuario
      const newUser: User = {
        id: this.generateUserId(),
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        name: formData.name,
        birthDate: formData.birthDate,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        userType: formData.userType,
        service: formData.service || undefined,
        createdAt: new Date(),
        status: 'active'
      };

      // Agregar usuario a la lista
      this.users.push(newUser);

      // Guardar en localStorage
      this.saveUsersToStorage();

      // Mostrar mensaje de éxito
      this.showSuccessMessage('Usuario creado exitosamente');

      // Resetear formulario
      this.resetForm();

      this.isLoading = false;
      this.updateButtonState(false);

    } catch (error) {
      this.showErrorMessage('Error al crear el usuario. Inténtalo de nuevo.');
      this.isLoading = false;
      this.updateButtonState(false);
    }
  }

  // Resetear formulario
  private resetForm(): void {
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) {
      form.reset();
      // Restaurar valor por defecto del tipo de usuario
      const userTypeSelect = document.getElementById('userType') as HTMLSelectElement;
      if (userTypeSelect) {
        userTypeSelect.value = 'Empleado';
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
  }

  // Generar ID único
  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obtener mensaje de error para campos
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

  // Cargar usuarios
  loadUsers(): void {
    const savedUsers = localStorage.getItem('beauty_salon_users');
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    } else {
      // Datos de ejemplo
      this.users = [
        {
          id: 'user_1',
          documentType: 'cedula',
          documentNumber: '12345678',
          name: 'María González',
          birthDate: '1990-05-15',
          phoneNumber: '+57 300 123 4567',
          email: 'maria.gonzalez@email.com',
          userType: 'Empleado',
          service: 'unas-semi',
          createdAt: new Date('2024-01-15'),
          status: 'active'
        },
        {
          id: 'user_2',
          documentType: 'cedula',
          documentNumber: '87654321',
          name: 'Ana Rodríguez',
          birthDate: '1985-08-22',
          phoneNumber: '+57 310 987 6543',
          email: 'ana.rodriguez@email.com',
          userType: 'Administrador',
          createdAt: new Date('2024-01-10'),
          status: 'active'
        }
      ];
    }

    this.filteredUsers = [...this.users];
    this.updatePagination();
    this.renderUsersTable();
  }

  // Filtrar usuarios
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

  // Actualizar paginación
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

  // Página anterior
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.renderUsersTable();
    }
  }

  // Página siguiente
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.renderUsersTable();
    }
  }

  // Renderizar tabla
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
  }

  // Editar usuario
  editUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      console.log('Editar usuario:', user);
      alert(`Funcionalidad de edición para ${user.name} en desarrollo`);
    }
  }

  // Eliminar usuario
  deleteUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user && confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.name}?`)) {
      this.users = this.users.filter(u => u.id !== userId);
      this.saveUsersToStorage();
      this.filterUsers();
      this.showSuccessMessage('Usuario eliminado exitosamente');
    }
  }

  // Guardar en localStorage
  private saveUsersToStorage(): void {
    localStorage.setItem('beauty_salon_users', JSON.stringify(this.users));
  }

  // Mostrar mensaje de éxito
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showMessage(message, 'success');
  }

  // Mostrar mensaje de error
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showMessage(message, 'error');
  }

  // Mostrar mensaje general
  private showMessage(message: string, type: 'success' | 'error'): void {
    // Crear elemento de mensaje si no existe
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

  // Limpiar mensajes
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const successDiv = document.querySelector('.success-message') as HTMLElement;
    const errorDiv = document.querySelector('.error-message-global') as HTMLElement;

    if (successDiv) successDiv.classList.remove('show');
    if (errorDiv) errorDiv.classList.remove('show');
  }

  ngAfterViewInit(): void {
    // Hacer la instancia accesible globalmente
    (window as any).crearUsuarioComponent = this;
  }

  ngOnDestroy(): void {
    // Limpiar referencia global
    if ((window as any).crearUsuarioComponent === this) {
      delete (window as any).crearUsuarioComponent;
    }
  }
}