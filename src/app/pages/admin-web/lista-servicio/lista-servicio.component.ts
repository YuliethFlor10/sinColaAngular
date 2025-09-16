import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminWeb } from "../admin-web";

// Interface para el servicio
interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  status: 'Activo' | 'Inactivo';
  userType: string;
  assignedUser: string;
  createdAt: Date;
}

@Component({
  selector: 'app-servicios',
  templateUrl: './lista-servicio.component.html',
  styleUrls: ['./lista-servicio.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AdminWeb]
})
export class ServiciosComponent implements OnInit, AfterViewInit, OnDestroy {

  // Propiedades del componente
  services: Service[] = [];
  filteredServices: Service[] = [];
  searchTerm: string = '';
  currentEditingId: string | null = null;
  serviceForm: FormGroup;

  // Referencias a elementos del DOM
  private serviceModal?: HTMLElement;
  private deleteModal?: HTMLElement;
  private mobileOverlay?: HTMLElement;
  private sidebar?: HTMLElement;

  constructor(private formBuilder: FormBuilder) {
    this.serviceForm = this.createServiceForm();
  }

  ngOnInit(): void {
    this.loadServices();
    this.setupEventListeners();
  }

  ngAfterViewInit(): void {
    // Hacer la instancia accesible globalmente para los botones inline
    (window as any).serviciosComponent = this;
    this.initializeDOM();
  }

  ngOnDestroy(): void {
    // Limpiar referencia global
    if ((window as any).serviciosComponent === this) {
      delete (window as any).serviciosComponent;
    }
    this.removeEventListeners();
  }

  private initializeDOM(): void {
    this.serviceModal = document.getElementById('serviceModal') || undefined;
    this.deleteModal = document.getElementById('deleteModal') || undefined;
    this.mobileOverlay = document.getElementById('mobileOverlay') || undefined;
    this.sidebar = document.querySelector('.sidebar') || undefined;
  }

  private createServiceForm(): FormGroup {
    return this.formBuilder.group({
      serviceName: ['', [Validators.required, Validators.minLength(3)]],
      serviceDuration: ['', Validators.required],
      servicePrice: ['', [Validators.required, Validators.min(0)]],
      serviceStatus: ['Activo', Validators.required],
      userType: ['', Validators.required],
      assignedUser: ['', Validators.required]
    });
  }

  private setupEventListeners(): void {
    // Botón agregar servicio
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
      addServiceBtn.addEventListener('click', () => this.openAddServiceModal());
    }

    // Botón flotante
    const floatingActionBtn = document.getElementById('floatingActionBtn');
    if (floatingActionBtn) {
      floatingActionBtn.addEventListener('click', () => this.openAddServiceModal());
    }

    // Campo de búsqueda
    const searchField = document.getElementById('searchField');
    if (searchField) {
      searchField.addEventListener('input', (e) => {
        this.searchTerm = (e.target as HTMLInputElement).value;
        this.filterServices();
      });
    }

    // Modal de servicio - botones
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeServiceModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeServiceModal());
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveService();
      });
    }

    // Modal de eliminación - botones
    const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');
    const deleteModalCancelBtn = document.getElementById('deleteModalCancelBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (deleteModalCloseBtn) {
      deleteModalCloseBtn.addEventListener('click', () => this.closeDeleteModal());
    }
    if (deleteModalCancelBtn) {
      deleteModalCancelBtn.addEventListener('click', () => this.closeDeleteModal());
    }
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
    }

    // Formulario
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
      serviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveService();
      });
    }

    // Cerrar modales al hacer clic en el backdrop
    if (this.serviceModal) {
      this.serviceModal.addEventListener('click', (e) => {
        if (e.target === this.serviceModal) {
          this.closeServiceModal();
        }
      });
    }

    if (this.deleteModal) {
      this.deleteModal.addEventListener('click', (e) => {
        if (e.target === this.deleteModal) {
          this.closeDeleteModal();
        }
      });
    }

    // Overlay móvil
    if (this.mobileOverlay) {
      this.mobileOverlay.addEventListener('click', () => {
        this.closeMobileSidebar();
      });
    }

    // Toggle del sidebar
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Detectar cambios de tamaño de pantalla para responsive
    window.addEventListener('resize', () => this.handleResize());
  }

  private removeEventListeners(): void {
    window.removeEventListener('resize', () => this.handleResize());
  }

  private loadServices(): void {
    // Cargar desde localStorage o usar datos de ejemplo
    const savedServices = localStorage.getItem('beauty_salon_services');
    if (savedServices) {
      this.services = JSON.parse(savedServices);
    } else {
      // Datos de ejemplo
      this.services = [
        {
          id: 'service_1',
          name: 'Manicure completa',
          duration: '01:30',
          price: 35000,
          status: 'Activo',
          userType: 'Empleado',
          assignedUser: 'Yulieth',
          createdAt: new Date()
        },
        {
          id: 'service_2',
          name: 'Pedicure con esmaltado',
          duration: '02:00',
          price: 45000,
          status: 'Activo',
          userType: 'Empleado',
          assignedUser: 'Juanita',
          createdAt: new Date()
        },
        {
          id: 'service_3',
          name: 'Extensión de pestañas',
          duration: '02:30',
          price: 80000,
          status: 'Inactivo',
          userType: 'Administrador',
          assignedUser: 'Pablito',
          createdAt: new Date()
        }
      ];
      this.saveServicesToStorage();
    }

    this.filteredServices = [...this.services];
    this.renderServices();
  }

  private saveServicesToStorage(): void {
    localStorage.setItem('beauty_salon_services', JSON.stringify(this.services));
  }

  private filterServices(): void {
    if (!this.searchTerm.trim()) {
      this.filteredServices = [...this.services];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredServices = this.services.filter(service =>
        service.name.toLowerCase().includes(term) ||
        service.id.toLowerCase().includes(term)
      );
    }
    this.renderServices();
  }

  private renderServices(): void {
    this.renderTableView();
    this.renderMobileCards();
  }

  private renderTableView(): void {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    if (this.filteredServices.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
            ${this.searchTerm ? 'No se encontraron servicios que coincidan con la búsqueda' : 'No hay servicios registrados'}
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    this.filteredServices.forEach(service => {
      const row = document.createElement('tr');
      row.className = 'service-data-row';

      row.innerHTML = `
        <td class="data-cell cell-nombre">${service.name}</td>
        <td class="data-cell cell-duracion">${this.formatDuration(service.duration)}</td>
        <td class="data-cell cell-precio">$${this.formatPrice(service.price)}</td>
        <td class="data-cell">
          <span class="status-indicator status-${service.status.toLowerCase()}">${service.status}</span>
        </td>
        <td class="data-cell cell-acciones">
          <div class="action-buttons-container">
            <button class="action-btn edit-btn" onclick="window.serviciosComponent?.editService('${service.id}')" title="Editar">
              <span class="action-icon">✏</span>
            </button>
            <button class="action-btn delete-btn" onclick="window.serviciosComponent?.openDeleteModal('${service.id}')" title="Eliminar">
              <span class="action-icon">🗑</span>
            </button>
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  private renderMobileCards(): void {
    const mobileCards = document.getElementById('mobileCards');
    if (!mobileCards) return;

    if (this.filteredServices.length === 0) {
      mobileCards.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #6b7280;">
          ${this.searchTerm ? 'No se encontraron servicios que coincidan con la búsqueda' : 'No hay servicios registrados'}
        </div>
      `;
      return;
    }

    mobileCards.innerHTML = '';
    this.filteredServices.forEach(service => {
      const card = document.createElement('div');
      card.className = 'service-card';

      card.innerHTML = `
        <div class="card-header">
          <h3 class="card-title">${service.name}</h3>
          <span class="status-indicator status-${service.status.toLowerCase()}">${service.status}</span>
        </div>
        <div class="card-body">
          <div class="card-field">
            <span class="card-field-label">Duración</span>
            <span class="card-field-value">${this.formatDuration(service.duration)}</span>
          </div>
          <div class="card-field">
            <span class="card-field-label">Precio</span>
            <span class="card-field-value">$${this.formatPrice(service.price)}</span>
          </div>
          <div class="card-field">
            <span class="card-field-label">Usuario</span>
            <span class="card-field-value">${service.assignedUser}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn edit-btn" onclick="window.serviciosComponent?.editService('${service.id}')" title="Editar">
            <span class="action-icon">✏</span>
          </button>
          <button class="action-btn delete-btn" onclick="window.serviciosComponent?.openDeleteModal('${service.id}')" title="Eliminar">
            <span class="action-icon">🗑</span>
          </button>
        </div>
      `;

      mobileCards.appendChild(card);
    });
  }

  private formatDuration(duration: string): string {
    // Convertir formato HH:MM a texto legible
    const [hours, minutes] = duration.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);

    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += '${m}m';

    return result.trim() || '0m';
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('es-CO');
  }

  // Métodos públicos para los botones inline
  public openAddServiceModal(): void {
    this.currentEditingId = null;
    this.resetForm();
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');

    if (modalTitle) modalTitle.textContent = 'Agregar nuevo servicio';
    if (saveBtn) saveBtn.textContent = 'Guardar servicio';

    this.showModal(this.serviceModal);
  }

  public editService(serviceId: string): void {
    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;

    this.currentEditingId = serviceId;
    this.populateForm(service);

    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');

    if (modalTitle) modalTitle.textContent = 'Editar servicio';
    if (saveBtn) saveBtn.textContent = 'Actualizar servicio';

    this.showModal(this.serviceModal);
  }

  public openDeleteModal(serviceId: string): void {
    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;

    this.currentEditingId = serviceId;
    const deleteMessage = document.getElementById('deleteMessage');
    if (deleteMessage) {
     deleteMessage.textContent = `¿Estás seguro de que deseas eliminar "${service.name}"?`;
    }

    this.showModal(this.deleteModal);
  }

  private resetForm(): void {
    const form = document.getElementById('serviceForm') as HTMLFormElement;
    if (form) form.reset();

    // Establecer valores por defecto
    const serviceStatus = document.getElementById('serviceStatus') as HTMLSelectElement;
    if (serviceStatus) serviceStatus.value = 'Activo';
  }

  private populateForm(service: Service): void {
    const serviceName = document.getElementById('serviceName') as HTMLInputElement;
    const serviceDuration = document.getElementById('serviceDuration') as HTMLInputElement;
    const servicePrice = document.getElementById('servicePrice') as HTMLInputElement;
    const serviceStatus = document.getElementById('serviceStatus') as HTMLSelectElement;

    if (serviceName) serviceName.value = service.name;
    if (serviceDuration) serviceDuration.value = service.duration;
    if (servicePrice) servicePrice.value = service.price.toString();
    if (serviceStatus) serviceStatus.value = service.status;
  }

  private getFormData(): Partial<Service> {
    const serviceName = document.getElementById('serviceName') as HTMLInputElement;
    const serviceDuration = document.getElementById('serviceDuration') as HTMLInputElement;
    const servicePrice = document.getElementById('servicePrice') as HTMLInputElement;
    const serviceStatus = document.getElementById('serviceStatus') as HTMLSelectElement;

    return {
      name: serviceName?.value || '',
      duration: serviceDuration?.value || '',
      price: parseInt(servicePrice?.value || '0'),
      status: (serviceStatus?.value as 'Activo' | 'Inactivo') || 'Activo',
      userType: 'Empleado', // Valor por defecto ya que el select no tiene ID único
      assignedUser: 'Por asignar' // Valor por defecto ya que el select no tiene ID único
    };
  }

  private validateForm(): boolean {
    const formData = this.getFormData();

    if (!formData.name || formData.name.trim().length < 3) {
      this.showToast('El nombre del servicio debe tener al menos 3 caracteres', 'error');
      return false;
    }

    if (!formData.duration) {
      this.showToast('La duración es requerida', 'error');
      return false;
    }

    if (!formData.price || formData.price <= 0) {
      this.showToast('El precio debe ser mayor a 0', 'error');
      return false;
    }

    return true;
  }

  private saveService(): void {
    if (!this.validateForm()) return;

    const formData = this.getFormData();

    try {
      if (this.currentEditingId) {
        // Actualizar servicio existente
        const index = this.services.findIndex(s => s.id === this.currentEditingId);
        if (index !== -1) {
          this.services[index] = {
            ...this.services[index],
            ...formData,
            name: formData.name!,
            duration: formData.duration!,
            price: formData.price!,
            status: formData.status!
          };
          this.showToast('Servicio actualizado exitosamente', 'success');
        }
      } else {
        // Crear nuevo servicio
        const newService: Service = {
          id: this.generateServiceId(),
          name: formData.name!,
          duration: formData.duration!,
          price: formData.price!,
          status: formData.status!,
          userType: formData.userType!,
          assignedUser: formData.assignedUser!,
          createdAt: new Date()
        };

        this.services.push(newService);
        this.showToast('Servicio creado exitosamente', 'success');
      }

      this.saveServicesToStorage();
      this.filterServices();
      this.closeServiceModal();

    } catch (error) {
      this.showToast('Error al guardar el servicio', 'error');
    }
  }

  public confirmDelete(): void {
    if (!this.currentEditingId) return;

    const index = this.services.findIndex(s => s.id === this.currentEditingId);
    if (index !== -1) {
      this.services.splice(index, 1);
      this.saveServicesToStorage();
      this.filterServices();
      this.closeDeleteModal();
      this.showToast('Servicio eliminado exitosamente', 'success');
    }
  }

  private generateServiceId(): string {
    return 'service_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private showModal(modal?: HTMLElement): void {
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  private closeServiceModal(): void {
    if (this.serviceModal) {
      this.serviceModal.classList.remove('show');
      document.body.style.overflow = '';
      this.currentEditingId = null;
    }
  }

  private closeDeleteModal(): void {
    if (this.deleteModal) {
      this.deleteModal.classList.remove('show');
      document.body.style.overflow = '';
      this.currentEditingId = null;
    }
  }

  private toggleSidebar(): void {
    if (this.sidebar) {
      const isOpen = this.sidebar.classList.contains('open');

      if (isOpen) {
        this.closeMobileSidebar();
      } else {
        this.openMobileSidebar();
      }
    }
  }

  private openMobileSidebar(): void {
    if (this.sidebar) {
      this.sidebar.classList.add('open');
    }
    if (this.mobileOverlay) {
      this.mobileOverlay.classList.add('show');
    }
  }

  private closeMobileSidebar(): void {
    if (this.sidebar) {
      this.sidebar.classList.remove('open');
    }
    if (this.mobileOverlay) {
      this.mobileOverlay.classList.remove('show');
    }
  }

  private handleResize(): void {
    // Cerrar sidebar en desktop
    if (window.innerWidth > 768) {
      this.closeMobileSidebar();
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Remover toast existente
    const existingToast = document.querySelector('.message-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `message-toast message-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remover después de 5 segundos
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}