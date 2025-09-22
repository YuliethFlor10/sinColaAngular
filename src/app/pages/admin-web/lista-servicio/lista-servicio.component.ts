import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ServicesService } from '../../../services/services.service';

// ========================================
// INTERFACES PARA TIPADO FUERTE
// ========================================

/**
 * Interfaz para la respuesta de la API Laravel (servicios)
 */
interface ApiServiceResponse {
  id: number;
  nombre: string;
  tiempo_estimado: number; // en minutos
  precio: number;
  creado_en?: string;
  actualizado_en?: string;
  // Relaciones cargadas con eager loading
  status?: {
    id: number;
    nombre: string;
  };
  category?: {
    id: number;
    nombre: string;
  };
}

/**
 * Interfaz para el servicio en el frontend
 */
export interface Service {
  id: number | string;
  name: string;
  duration: string; // formato HH:MM
  price: number;
  status: 'Activo' | 'Inactivo';
  category: string;
  createdAt?: Date;
}

/**
 * Interfaz para los datos del formulario
 */
interface ServiceFormData {
  name: string;
  duration: string; // formato HH:MM
  price: number;
  status: 'Activo' | 'Inactivo';
}

/**
 * Interfaz para los datos que se envían a la API
 * CORREGIDA para coincidir exactamente con Laravel
 */
interface ApiServiceRequest {
  nombre: string;
  tiempo_estimado: number; // en minutos
  precio: number;
  tipos_id: number;        // CORREGIDO: era 'categorias_id'
  estados_id: number;      // ID del status (1 = Activo, 2 = Inactivo)
  negocios_id: number;     // ID del negocio - REQUERIDO por tu validación
}

@Component({
  selector: 'app-servicios',
  templateUrl: './lista-servicio.component.html',
  styleUrls: ['./lista-servicio.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AdminWeb, ContenidoComponent]
})
export class ServiciosComponent implements OnInit, AfterViewInit, OnDestroy {

  // ========================================
  // PROPIEDADES PRINCIPALES
  // ========================================

  services: Service[] = [];
  filteredServices: Service[] = [];
  searchTerm: string = '';
  currentEditingId: string | number | null = null;
  serviceForm: FormGroup;
  isLoading: boolean = false;

  // Referencias a elementos del DOM
  private serviceModal?: HTMLElement;
  private deleteModal?: HTMLElement;
  private mobileOverlay?: HTMLElement;
  private sidebar?: HTMLElement;

  constructor(
    private formBuilder: FormBuilder,
    private servicesService: ServicesService
  ) {
    this.serviceForm = this.createServiceForm();
  }

  // ========================================
  // CICLO DE VIDA DEL COMPONENTE
  // ========================================

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

  // ========================================
  // INICIALIZACIÓN Y CONFIGURACIÓN DOM
  // ========================================

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
      serviceStatus: ['Activo', Validators.required]
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

  // ========================================
  // FUNCIONES DE API - CARGA DE DATOS
  // ========================================

  /**
   * 🔥 CARGAR SERVICIOS DESDE LA API - VERSIÓN CORREGIDA
   */
  private loadServices(): void {
    console.log('🔄 CARGANDO SERVICIOS DESDE LA API...');
    this.isLoading = true;

    this.servicesService.getAll().subscribe({
      next: (response: any) => {
        try {
          console.log('📋 RESPUESTA DE LA API (SERVICIOS):', response);

          // Manejar respuesta paginada de Laravel
          let rawServices: ApiServiceResponse[] = [];

          if (Array.isArray(response)) {
            rawServices = response;
          } else if (response && Array.isArray(response.data)) {
            rawServices = response.data;
          } else if (response && response.current_page) {
            // Respuesta paginada de Laravel
            rawServices = response.data || [];
          }

          console.log('🔍 SERVICIOS RAW:', rawServices);

          // Transformar datos de la API al formato del frontend
          this.services = rawServices.map(this.mapApiServiceToService.bind(this));
          this.filteredServices = [...this.services];

          console.log('✅ SERVICIOS TRANSFORMADOS:', this.services);

          this.renderServices();
          this.updateServiceCounter();

        } catch (error) {
          console.error('Error procesando respuesta de servicios:', error);
          this.showToast('Error al procesar los datos de servicios', 'error');
        } finally {
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error cargando servicios:', error);
        const errorMsg = error?.error?.message || 'Error al cargar servicios desde la API';
        this.showToast(errorMsg, 'error');
        this.services = [];
        this.filteredServices = [];
        this.renderServices();
        this.isLoading = false;
      }
    });
  }

  // ========================================
  // TRANSFORMADORES DE DATOS
  // ========================================

  /**
   * 🔥 TRANSFORMAR DATOS DE LA API AL FORMATO DEL FRONTEND
   */
  private mapApiServiceToService(apiService: ApiServiceResponse): Service {
    console.log('🔄 TRANSFORMANDO SERVICIO DE API:', apiService);

    const transformedService: Service = {
      id: apiService.id,
      name: apiService.nombre || 'Sin nombre',
      duration: this.minutesToDuration(apiService.tiempo_estimado || 0),
      price: apiService.precio || 0,
      status: apiService.status?.nombre === 'Activo' ? 'Activo' : 'Inactivo',
      category: apiService.category?.nombre || 'Sin categoría',
      createdAt: apiService.creado_en ? new Date(apiService.creado_en) : new Date()
    };

    console.log('✅ SERVICIO TRANSFORMADO:', transformedService);
    return transformedService;
  }

  /**
   * 🔥 TRANSFORMAR DATOS DEL FORMULARIO AL FORMATO DE LA API - CORREGIDO CON IDs EXACTOS
   */
  private mapFormDataToApiRequest(formData: ServiceFormData): ApiServiceRequest {
    console.log('🔄 TRANSFORMANDO DATOS DEL FORMULARIO:', formData);

    // MAPEAR ESTADO STRING A ID NUMÉRICO (BASADO EN TU SCRIPT SQL)
    let estadoId = 1; // Por defecto Activo
    switch (formData.status) {
      case 'Activo':
        estadoId = 1; // ID 1 = 'Activo' en tu tabla statuses
        break;
      case 'Inactivo':
        estadoId = 2; // ID 2 = 'Inactivo' en tu tabla statuses
        break;
    }

    const apiData: ApiServiceRequest = {
      nombre: formData.name,
      tiempo_estimado: this.durationToMinutes(formData.duration),
      precio: formData.price,
      // 🔥 IDs EXACTOS SEGÚN TU SCRIPT SQL:
      tipos_id: 12,       // ID 12 = 'Manicure' (puedes cambiar por 11='Corte de Cabello' si prefieres)
      estados_id: estadoId,
      negocios_id: 1      // ID 1 = 'Salón de Belleza Glamour' (primer negocio en tu DB)
    };

    console.log('🔍 DATOS PARA LA API (IDs EXACTOS DE TU DB):', apiData);
    console.log('🔍 Mapeos aplicados según tu script SQL:');
    console.log('   - tipos_id: 12 (Manicure - categoria servicio)');
    console.log('   - estados_id:', estadoId, `(${formData.status})`);
    console.log('   - negocios_id: 1 (Salón de Belleza Glamour)');

    return apiData;
  }

  // ========================================
  // UTILIDADES DE CONVERSIÓN DE TIEMPO
  // ========================================

  /**
   * Convertir minutos a formato HH:MM
   */
  private minutesToDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Convertir formato HH:MM a minutos
   */
  private durationToMinutes(duration: string): number {
    const [hours, minutes] = duration.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  // ========================================
  // FUNCIONES DE GUARDADO EN LA API
  // ========================================

  /**
   * 🔥 CREAR SERVICIO EN LA API - VERSIÓN CORREGIDA
   */
  private createService(formData: ServiceFormData): void {
    console.log('🚀 INICIANDO CREACIÓN DE SERVICIO...');

    const apiData = this.mapFormDataToApiRequest(formData);

    this.servicesService.create(apiData).subscribe({
      next: (response: any) => {
        console.log('✅ SERVICIO CREADO EXITOSAMENTE:', response);

        // 🔥 ACTUALIZAR LA LISTA LOCAL INMEDIATAMENTE
        if (response) {
          const newService = this.mapApiServiceToService(response);
          console.log('👤 NUEVO SERVICIO TRANSFORMADO:', newService);

          // Agregar al inicio de la lista local
          this.services.unshift(newService);
          this.filteredServices = [...this.services];

          // Re-renderizar
          this.renderServices();
          this.updateServiceCounter();

          console.log('📝 LISTA ACTUALIZADA. Total servicios:', this.services.length);
        }

        this.showToast('Servicio creado exitosamente', 'success');
        this.closeServiceModal();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ ERROR CREANDO SERVICIO:', error);

        let errorMessage = 'Error desconocido al crear el servicio.';

        if (error.status === 0) {
          errorMessage = 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose.';
        } else if (error.status === 422) {
          if (error.error?.errors) {
            const validationErrors = Object.entries(error.error.errors).map(([field, messages]) => {
              return `${field}: ${(messages as string[]).join(', ')}`;
            });
            errorMessage = 'Errores de validación: ' + validationErrors.join(' | ');
          } else {
            errorMessage = error.error?.message || 'Error de validación de datos';
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  /**
   * 🔥 ACTUALIZAR SERVICIO EN LA API - VERSIÓN CORREGIDA
   */
  private updateService(serviceId: string | number, formData: ServiceFormData): void {
    console.log('🔄 ACTUALIZANDO SERVICIO:', serviceId);

    const apiData = this.mapFormDataToApiRequest(formData);

    this.servicesService.update(serviceId, apiData).subscribe({
      next: (response: any) => {
        console.log('✅ SERVICIO ACTUALIZADO EXITOSAMENTE:', response);

        // 🔥 ACTUALIZAR LA LISTA LOCAL INMEDIATAMENTE
        if (response) {
          const updatedService = this.mapApiServiceToService(response);

          // Encontrar y actualizar el servicio en la lista
          const index = this.services.findIndex(s => s.id.toString() === serviceId.toString());
          if (index !== -1) {
            this.services[index] = updatedService;
            this.filteredServices = [...this.services];

            // Re-renderizar
            this.renderServices();

            console.log('📝 SERVICIO ACTUALIZADO EN LISTA LOCAL');
          }
        }

        this.showToast('Servicio actualizado exitosamente', 'success');
        this.closeServiceModal();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ ERROR ACTUALIZANDO SERVICIO:', error);
        const errorMsg = error?.error?.message || 'Error al actualizar el servicio';
        this.showToast(errorMsg, 'error');
        this.isLoading = false;
      }
    });
  }

  // ========================================
  // FUNCIONES DE FILTRADO Y RENDERIZADO
  // ========================================

  private filterServices(): void {
    if (!this.searchTerm.trim()) {
      this.filteredServices = [...this.services];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredServices = this.services.filter(service =>
        service.name.toLowerCase().includes(term) ||
        service.id.toString().toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term)
      );
    }
    this.renderServices();
  }

  private renderServices(): void {
    this.renderTableView();
    this.renderMobileCards();
  }

  /**
   * 🔥 RENDERIZAR TABLA - VERSIÓN MEJORADA
   */
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
            <span class="card-field-label">Categoría</span>
            <span class="card-field-value">${service.category}</span>
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

  /**
   * 🔥 NUEVA FUNCIÓN: Actualizar contador de servicios
   */
  private updateServiceCounter(): void {
    const counterElement = document.getElementById('serviceCounter');
    if (counterElement) {
      counterElement.textContent = `Total: ${this.services.length} servicios`;
    }
  }

  // ========================================
  // FUNCIONES DE FORMATEO
  // ========================================

  private formatDuration(duration: string): string {
    const [hours, minutes] = duration.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);

    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m`;

    return result.trim() || '0m';
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('es-CO');
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA LOS BOTONES INLINE
  // ========================================

  public openAddServiceModal(): void {
    this.currentEditingId = null;
    this.resetForm();
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');

    if (modalTitle) modalTitle.textContent = 'Agregar nuevo servicio';
    if (saveBtn) saveBtn.textContent = 'Guardar servicio';

    this.showModal(this.serviceModal);
  }

  public editService(serviceId: string | number): void {
    const service = this.services.find(s => s.id.toString() === serviceId.toString());
    if (!service) return;

    this.currentEditingId = serviceId;
    this.populateForm(service);

    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');

    if (modalTitle) modalTitle.textContent = 'Editar servicio';
    if (saveBtn) saveBtn.textContent = 'Actualizar servicio';

    this.showModal(this.serviceModal);
  }

  public openDeleteModal(serviceId: string | number): void {
    const service = this.services.find(s => s.id.toString() === serviceId.toString());
    if (!service) return;

    this.currentEditingId = serviceId;
    const deleteMessage = document.getElementById('deleteMessage');
    if (deleteMessage) {
      deleteMessage.textContent = `¿Estás seguro de que deseas eliminar "${service.name}"?`;
    }

    this.showModal(this.deleteModal);
  }

  /**
   * 🔥 CONFIRMAR ELIMINACIÓN - VERSIÓN CORREGIDA CON API
   */
  public confirmDelete(): void {
    if (!this.currentEditingId) return;

    console.log('🗑️ ELIMINANDO SERVICIO:', this.currentEditingId);
    this.isLoading = true;

    this.servicesService.delete(this.currentEditingId).subscribe({
      next: () => {
        console.log('✅ SERVICIO ELIMINADO EXITOSAMENTE');

        // 🔥 ACTUALIZAR LA LISTA LOCAL INMEDIATAMENTE
        this.services = this.services.filter(s => s.id.toString() !== this.currentEditingId?.toString());
        this.filteredServices = this.filteredServices.filter(s => s.id.toString() !== this.currentEditingId?.toString());

        // Re-renderizar
        this.renderServices();
        this.updateServiceCounter();

        console.log('📝 SERVICIO ELIMINADO DE LISTA LOCAL. Total:', this.services.length);

        this.closeDeleteModal();
        this.showToast('Servicio eliminado exitosamente', 'success');
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ ERROR ELIMINANDO SERVICIO:', error);
        const errorMsg = error?.error?.message || 'Error al eliminar el servicio';
        this.showToast(errorMsg, 'error');
        this.isLoading = false;
      }
    });
  }

  // ========================================
  // FUNCIONES DEL FORMULARIO
  // ========================================

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

  private getFormData(): ServiceFormData {
    const serviceName = document.getElementById('serviceName') as HTMLInputElement;
    const serviceDuration = document.getElementById('serviceDuration') as HTMLInputElement;
    const servicePrice = document.getElementById('servicePrice') as HTMLInputElement;
    const serviceStatus = document.getElementById('serviceStatus') as HTMLSelectElement;

    return {
      name: serviceName?.value || '',
      duration: serviceDuration?.value || '',
      price: parseInt(servicePrice?.value || '0'),
      status: (serviceStatus?.value as 'Activo' | 'Inactivo') || 'Activo'
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

  /**
   * 🔥 GUARDAR SERVICIO - VERSIÓN CORREGIDA CON API
   */
  private saveService(): void {
    if (!this.validateForm()) return;

    const formData = this.getFormData();
    this.isLoading = true;

    try {
      if (this.currentEditingId) {
        // Actualizar servicio existente
        this.updateService(this.currentEditingId, formData);
      } else {
        // Crear nuevo servicio
        this.createService(formData);
      }
    } catch (error) {
      console.error('Error en saveService:', error);
      this.showToast('Error al procesar el servicio', 'error');
      this.isLoading = false;
    }
  }

  // ========================================
  // FUNCIONES DE MODALES
  // ========================================

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

  // ========================================
  // FUNCIONES DE SIDEBAR Y RESPONSIVE
  // ========================================

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

  // ========================================
  // FUNCIONES DE MENSAJES Y UTILIDADES
  // ========================================

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

  // ========================================
  // FUNCIONALIDADES ADICIONALES
  // ========================================

  /**
   * Refrescar lista de servicios manualmente
   * 🔥 MEJORADA CON INDICADOR DE CARGA
   */
  public refreshServices(): void {
    console.log('🔄 REFRESCANDO LISTA DE SERVICIOS...');
    this.loadServices();

    // Mostrar indicador temporal de actualización
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

  /**
   * Exportar lista de servicios (funcionalidad futura)
   */
  public exportServices(): void {
    console.log('Exportando servicios...', this.filteredServices);
    this.showToast('Funcionalidad de exportación estará disponible próximamente', 'info');
  }

  /**
   * Obtener estadísticas de servicios
   * 🔥 VERSIÓN MEJORADA CON MÁS ESTADÍSTICAS
   */
  public getServiceStats(): {
    total: number,
    active: number,
    inactive: number,
    byCategory: Record<string, number>,
    avgPrice: number,
    totalRevenue: number
  } {
    const stats = {
      total: this.services.length,
      active: this.services.filter(s => s.status === 'Activo').length,
      inactive: this.services.filter(s => s.status === 'Inactivo').length,
      byCategory: {} as Record<string, number>,
      avgPrice: 0,
      totalRevenue: 0
    };

    // Contar por categoría
    this.services.forEach(service => {
      stats.byCategory[service.category] = (stats.byCategory[service.category] || 0) + 1;
      stats.totalRevenue += service.price;
    });

    // Calcular precio promedio
    if (this.services.length > 0) {
      stats.avgPrice = stats.totalRevenue / this.services.length;
    }

    // Log de estadísticas para debugging
    console.log('📊 ESTADÍSTICAS DE SERVICIOS:', stats);

    return stats;
  }

  /**
   * 🔥 NUEVA FUNCIÓN: Buscar servicio por nombre (para evitar duplicados)
   */
  private checkIfServiceNameExists(name: string, excludeId?: string | number): boolean {
    return this.services.some(service =>
      service.name.toLowerCase() === name.toLowerCase() &&
      service.id.toString() !== excludeId?.toString()
    );
  }

  // ========================================
  // FUNCIONES DE DEBUGGING Y MONITOREO
  // ========================================

  /**
   * Función de debugging para inspeccionar el estado actual
   */
  public debugCurrentState(): void {
    console.log('🔍 ESTADO ACTUAL DEL COMPONENTE SERVICIOS:');
    console.log('   - Total servicios:', this.services.length);
    console.log('   - Servicios filtrados:', this.filteredServices.length);
    console.log('   - Término de búsqueda:', this.searchTerm);
    console.log('   - Editando ID:', this.currentEditingId);
    console.log('   - Cargando:', this.isLoading);
    console.log('   - Lista completa:', this.services);
    console.log('   - Estadísticas:', this.getServiceStats());
  }

  /**
   * Función para verificar sincronización entre frontend y backend
   */
  public async verifySyncWithBackend(): Promise<void> {
    console.log('🔄 VERIFICANDO SINCRONIZACIÓN CON BACKEND...');

    try {
      this.servicesService.getAll().subscribe({
        next: (backendServices: any) => {
          const backendCount = Array.isArray(backendServices) ? backendServices.length : backendServices?.data?.length || 0;
          const frontendCount = this.services.length;

          console.log('📊 COMPARACIÓN DE DATOS:');
          console.log('   - Backend:', backendCount, 'servicios');
          console.log('   - Frontend:', frontendCount, 'servicios');

          if (backendCount === frontendCount) {
            console.log('✅ SINCRONIZACIÓN CORRECTA');
            this.showToast('Datos sincronizados correctamente', 'success');
          } else {
            console.log('⚠️ DESINCRONIZACIÓN DETECTADA');
            console.log('   - Recargando datos del backend...');
            this.loadServices();
            this.showToast('Se detectó desincronización. Recargando datos...', 'info');
          }
        },
        error: (error) => {
          console.error('❌ ERROR EN VERIFICACIÓN:', error);
          this.showToast('Error al verificar sincronización con el backend', 'error');
        }
      });
    } catch (error) {
      console.error('❌ ERROR EN VERIFICACIÓN ASYNC:', error);
      this.showToast('Error en verificación asíncrona', 'error');
    }
  }

  // ========================================
  // UTILIDADES ADICIONALES
  // ========================================

  /**
   * Generar ID único para servicios (uso interno si fuera necesario)
   */
  private generateServiceId(): string {
    return 'service_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
   * Limpiar y normalizar texto
   */
  private sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validar formato de duración HH:MM
   */
  private isValidDuration(duration: string): boolean {
    const durationRegex = /^([0-9]{1,2}):([0-5][0-9])$/;
    return durationRegex.test(duration);
  }

  /**
   * Validar precio
   */
  private isValidPrice(price: number): boolean {
    return !isNaN(price) && price > 0 && price <= 999999999;
  }

  /**
   * 🔥 FUNCIÓN PARA USO CON localStorage (RESPALDO)
   * Solo se usa si hay problemas con la API
   */
  private saveServicesToStorage(): void {
    try {
      localStorage.setItem('beauty_salon_services_backup', JSON.stringify(this.services));
    } catch (error) {
      console.warn('No se pudo guardar respaldo en localStorage:', error);
    }
  }

  /**
   * 🔥 FUNCIÓN PARA CARGAR DESDE localStorage (RESPALDO)
   * Solo se usa si hay problemas con la API
   */
  private loadServicesFromStorage(): Service[] {
    try {
      const stored = localStorage.getItem('beauty_salon_services_backup');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('No se pudo cargar respaldo desde localStorage:', error);
      return [];
    }
  }

  // ========================================
  // FUNCIONES DE VALIDACIÓN AVANZADA
  // ========================================

  /**
   * Validar datos completos del servicio
   */
  private validateServiceData(service: Partial<Service>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!service.name || service.name.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }

    if (service.name && service.name.length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }

    if (!service.duration || !this.isValidDuration(service.duration)) {
      errors.push('La duración debe estar en formato HH:MM válido');
    }

    if (!service.price || !this.isValidPrice(service.price)) {
      errors.push('El precio debe ser un número mayor a 0');
    }

    if (!service.status || !['Activo', 'Inactivo'].includes(service.status)) {
      errors.push('El estado debe ser Activo o Inactivo');
    }

    // Verificar duplicados de nombre
    if (service.name && this.checkIfServiceNameExists(service.name, service.id)) {
      errors.push('Ya existe un servicio con este nombre');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Mostrar errores de validación
   */
  private showValidationErrors(errors: string[]): void {
    const errorMessage = errors.join('\n• ');
    this.showToast(`Errores de validación:\n• ${errorMessage}`, 'error');
  }
}
