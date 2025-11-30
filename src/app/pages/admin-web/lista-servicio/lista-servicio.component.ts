import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ServicesService } from '../../../services/services.service';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

// INTERFACES
interface ApiServiceResponse {
  id: number;
  nombre: string;
  tiempo_estimado: number;
  precio: number;
  creado_en?: string;
  actualizado_en?: string;
  status?: { id: number; nombre: string; };
  category?: { id: number; nombre: string; };
  negocios_id?: number;
  assigned_users?: any[];
}

export interface Service {
  id: number | string;
  name: string;
  duration: string;
  price: number;
  status: 'Activo' | 'Inactivo';
  category: string;
  createdAt?: Date;
  assignedTo?: string;
  assignedUserId?: number;
}

interface ServiceFormData {
  name: string;
  duration: string;
  price: number;
  status: 'Activo' | 'Inactivo';
  userType: string;
  assignedUserId: number;
}

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  email: string;
  rol: string;
  roles_id?: number;
  negocios_id?: number;
}

@Component({
  selector: 'app-servicios',
  templateUrl: './lista-servicio.component.html',
  styleUrls: ['./lista-servicio.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, AdminWeb, ContenidoComponent]
})
export class ServiciosComponent implements OnInit {

  services: Service[] = [];
  filteredServices: Service[] = [];
  searchTerm: string = '';
  currentEditingId: string | number | null = null;
  isLoading: boolean = false;
  loadingUsers: boolean = false;
  openMenuId: number | string | null = null;

  usuariosDelNegocio: Usuario[] = [];
  negocioId: number = 1;
  negocioNombre: string = '';

  constructor(
    private servicesService: ServicesService,
    private usersService: UsersService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 COMPONENTE SERVICIOS INICIALIZADO');

    const user = this.authService.getCurrentUser();
    if (user?.negocios_id) {
      this.negocioId = user.negocios_id;
      this.negocioNombre = user.business?.nombre || `Negocio ${this.negocioId}`;
      console.log(`🏢 Negocio actual: ${this.negocioNombre} (ID: ${this.negocioId})`);
    }

    this.cargarUsuariosDelNegocio();
    this.loadServices();

    (window as any).serviciosComponent = this;
  }

  // ========================================
  // CARGAR USUARIOS DEL NEGOCIO
  // ========================================

  cargarUsuariosDelNegocio(): void {
    console.log(`📡 Cargando staff del negocio ${this.negocioNombre}...`);
    this.loadingUsers = true;

    this.usersService.getStaffForServices()
      .pipe(finalize(() => (this.loadingUsers = false)))
      .subscribe({
        next: (response: any) => {
          let usuarios = Array.isArray(response) ? response : (response.data || []);

          this.usuariosDelNegocio = usuarios
            .filter((u: any) =>
              u.negocios_id === this.negocioId &&
              (u.roles_id === 1 || u.roles_id === 3) &&
              (u.estados_id === 1 || u.status?.nombre === 'Activo')
            )
            .map((u: any) => ({
              id: u.id,
              nombres: u.nombres,
              apellidos: u.apellidos,
              nombre_completo: `${u.nombres} ${u.apellidos}`.trim(),
              email: u.email,
              rol: u.role?.nombre || (u.roles_id === 1 ? 'Administrador' : 'Empleado'),
              roles_id: u.roles_id,
              negocios_id: u.negocios_id
            }));

          console.log(`✅ ${this.usuariosDelNegocio.length} miembros del staff cargados`);
          setTimeout(() => this.poblarSelectUsuarios(), 100);
        },
        error: (error) => {
          console.error('❌ Error cargando staff:', error);
          this.showToast('Error al cargar el personal disponible', 'error');
        }
      });
  }

  poblarSelectUsuarios(): void {
    const userSelect = document.getElementById('serviceUser') as HTMLSelectElement;
    if (!userSelect) {
      console.warn('⚠️ Select serviceUser no encontrado');
      return;
    }

    userSelect.innerHTML = '<option value="">Seleccione un usuario</option>';

    this.usuariosDelNegocio.forEach(usuario => {
      const option = document.createElement('option');
      option.value = usuario.id.toString();
      option.textContent = `${usuario.nombre_completo} (${usuario.rol})`;
      userSelect.appendChild(option);
    });

    console.log(`✅ Select poblado con ${this.usuariosDelNegocio.length} usuarios`);
  }

  // ========================================
  // CARGAR SERVICIOS
  // ========================================

  loadServices(): void {
    console.log(`📥 Cargando servicios del negocio ${this.negocioNombre}...`);
    this.isLoading = true;

    this.servicesService.getAll().subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta API:', response);

        let rawServices: ApiServiceResponse[] = [];

        if (Array.isArray(response)) {
          rawServices = response as ApiServiceResponse[];
        } else if (response?.data) {
          rawServices = Array.isArray(response.data) ? response.data as ApiServiceResponse[] : [];
        }

        rawServices = rawServices.filter(s => s.negocios_id === this.negocioId);

        this.services = rawServices.map(s => this.transformService(s));
        this.filteredServices = [...this.services];

        console.log(`📊 Total servicios: ${this.services.length}`);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error:', error);
        this.showToast('Error al cargar servicios: ' + (error.message || 'Desconocido'), 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ========================================
  // TRANSFORMADORES
  // ========================================

  private transformService(api: ApiServiceResponse): Service {
    const assignedUser = api.assigned_users && api.assigned_users.length > 0 
      ? api.assigned_users[0] 
      : null;

    return {
      id: api.id,
      name: api.nombre || 'Sin nombre',
      duration: this.minutesToDuration(api.tiempo_estimado || 0),
      price: api.precio || 0,
      status: api.status?.nombre === 'Activo' ? 'Activo' : 'Inactivo',
      category: api.category?.nombre || 'Sin categoría',
      createdAt: api.creado_en ? new Date(api.creado_en) : new Date(),
      assignedTo: assignedUser ? `${assignedUser.nombres} ${assignedUser.apellidos}` : 'Sin asignar',
      assignedUserId: assignedUser?.id || 0
    };
  }

  private transformToApiRequest(form: ServiceFormData): any {
    console.log('🔄 ===== TRANSFORMANDO DATOS =====');
    console.log('Formulario original:', form);
    
    const payload = {
      nombre: form.name,
      tiempo_estimado: this.durationToMinutes(form.duration),
      precio: form.price,
      tipos_id: 12,
      estados_id: form.status === 'Activo' ? 1 : 2,
      negocios_id: this.negocioId,
      ...(form.assignedUserId && form.assignedUserId !== 0 
        ? { usuarios_asignados: [form.assignedUserId] } 
        : {})
    };
    
    console.log('📦 Payload transformado:', payload);
    console.log('=============================');
    return payload;
  }

  // ========================================
  // UTILIDADES DE TIEMPO
  // ========================================

  private minutesToDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private durationToMinutes(duration: string): number {
    const [h, m] = duration.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  public formatDuration(duration: string): string {
    const [h, m] = duration.split(':').map(Number);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m`;
    return result.trim() || '0m';
  }

  public formatPrice(price: number): string {
    return price.toLocaleString('es-CO');
  }

  // ========================================
  // BÚSQUEDA Y FILTRADO
  // ========================================

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.filterServices();
  }

  private filterServices(): void {
    if (!this.searchTerm.trim()) {
      this.filteredServices = [...this.services];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredServices = this.services.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.id.toString().includes(term) ||
        s.category.toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  // ========================================
  // MENÚ DESPLEGABLE
  // ========================================

  public toggleServiceMenu(serviceId: string | number): void {
    this.openMenuId = this.openMenuId === serviceId ? null : serviceId;
    this.cdr.detectChanges();
  }

  public closeAllMenus(): void {
    this.openMenuId = null;
    this.cdr.detectChanges();
  }

  // ========================================
  // MODALES
  // ========================================

  public openAddServiceModal(): void {
    console.log('➕ Abriendo modal CREAR');
    this.currentEditingId = null;
    this.closeAllMenus();
    this.resetForm();

    const modal = document.getElementById('serviceModal');
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('saveBtn');

    if (title) title.textContent = 'Agregar nuevo servicio';
    if (btn) btn.textContent = 'Guardar servicio';
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    setTimeout(() => this.poblarSelectUsuarios(), 100);
  }

  public editService(serviceId: string | number): void {
    console.log('✏️ Editando servicio:', serviceId);

    const service = this.services.find(s => s.id.toString() === serviceId.toString());
    if (!service) {
      console.error('❌ Servicio no encontrado');
      return;
    }

    this.currentEditingId = serviceId;
    this.closeAllMenus();
    this.populateForm(service);

    const modal = document.getElementById('serviceModal');
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('saveBtn');

    if (title) title.textContent = 'Editar servicio';
    if (btn) btn.textContent = 'Actualizar servicio';
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    setTimeout(() => this.poblarSelectUsuarios(), 100);
  }

  public closeServiceModal(): void {
    const modal = document.getElementById('serviceModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
    this.currentEditingId = null;
  }

  public openDeleteModal(serviceId: string | number): void {
    console.log('🗑️ Abriendo modal ELIMINAR:', serviceId);

    const service = this.services.find(s => s.id.toString() === serviceId.toString());
    if (!service) return;

    this.currentEditingId = serviceId;
    this.closeAllMenus();

    const modal = document.getElementById('deleteModal');
    const msg = document.getElementById('deleteMessage');

    if (msg) msg.textContent = `¿Estás seguro de eliminar "${service.name}"?`;
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  public closeDeleteModal(): void {
    const modal = document.getElementById('deleteModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
    this.currentEditingId = null;
  }

  // ========================================
  // FORMULARIO
  // ========================================

  private resetForm(): void {
    const form = document.getElementById('serviceForm') as HTMLFormElement;
    if (form) form.reset();

    const status = document.getElementById('serviceStatus') as HTMLSelectElement;
    if (status) status.value = 'Activo';

    const userSelect = document.getElementById('serviceUser') as HTMLSelectElement;
    if (userSelect) userSelect.value = '';

    const typeSelect = document.getElementById('serviceType') as HTMLSelectElement;
    if (typeSelect) typeSelect.value = '';
  }

  private populateForm(service: Service): void {
    const name = document.getElementById('serviceName') as HTMLInputElement;
    const duration = document.getElementById('serviceDuration') as HTMLInputElement;
    const price = document.getElementById('servicePrice') as HTMLInputElement;
    const status = document.getElementById('serviceStatus') as HTMLSelectElement;
    const user = document.getElementById('serviceUser') as HTMLSelectElement;

    if (name) name.value = service.name;
    if (duration) duration.value = service.duration;
    if (price) price.value = service.price.toString();
    if (status) status.value = service.status;
    if (user && service.assignedUserId) user.value = service.assignedUserId.toString();
  }

  private getFormData(): ServiceFormData {
    console.log('📋 ===== OBTENIENDO DATOS DEL FORMULARIO =====');

    const name = document.getElementById('serviceName') as HTMLInputElement;
    const duration = document.getElementById('serviceDuration') as HTMLInputElement;
    const price = document.getElementById('servicePrice') as HTMLInputElement;
    const status = document.getElementById('serviceStatus') as HTMLSelectElement;
    const type = document.getElementById('serviceType') as HTMLSelectElement;
    const user = document.getElementById('serviceUser') as HTMLSelectElement;

    // Verificar que los elementos existan
    if (!name) console.error('❌ Campo "serviceName" no encontrado');
    if (!duration) console.error('❌ Campo "serviceDuration" no encontrado');
    if (!price) console.error('❌ Campo "servicePrice" no encontrado');
    if (!status) console.error('❌ Campo "serviceStatus" no encontrado');
    if (!user) console.error('❌ Campo "serviceUser" no encontrado');

    const formData: ServiceFormData = {
      name: name?.value || '',
      duration: duration?.value || '',
      price: parseInt(price?.value || '0'),
      status: (status?.value as 'Activo' | 'Inactivo') || 'Activo',
      userType: type?.value || '',
      assignedUserId: parseInt(user?.value || '0')
    };

    console.log('📦 Datos extraídos del formulario:');
    console.log('   - Nombre:', formData.name);
    console.log('   - Duración:', formData.duration);
    console.log('   - Precio:', formData.price);
    console.log('   - Estado:', formData.status);
    console.log('   - Usuario ID:', formData.assignedUserId);
    console.log('   - Usuario (raw value):', user?.value);
    console.log('================================================');

    return formData;
  }

  private validateForm(): boolean {
    const data = this.getFormData();

    console.log('🔍 ===== VALIDANDO FORMULARIO =====');
    console.log('Datos obtenidos:', data);
    console.log('===================================');

    // Validar nombre
    console.log('📝 Validando nombre:', data.name);
    if (!data.name || data.name.trim().length < 3) {
      console.error('❌ Nombre inválido:', data.name);
      this.showToast('El nombre debe tener al menos 3 caracteres', 'error');
      return false;
    }
    console.log('✅ Nombre válido');

    // Validar duración
    console.log('⏱️ Validando duración:', data.duration);
    if (!data.duration || data.duration === '00:00') {
      console.error('❌ Duración inválida:', data.duration);
      this.showToast('La duración es requerida (debe ser mayor a 0)', 'error');
      return false;
    }
    console.log('✅ Duración válida');

    // Validar precio
    console.log('💰 Validando precio:', data.price);
    if (!data.price || data.price <= 0 || isNaN(data.price)) {
      console.error('❌ Precio inválido:', data.price);
      this.showToast('El precio debe ser mayor a 0', 'error');
      return false;
    }
    console.log('✅ Precio válido');

    // Validar usuario asignado
    console.log('👤 Validando usuario asignado:', data.assignedUserId);
    console.log('   Tipo:', typeof data.assignedUserId);
    console.log('   Usuarios disponibles:', this.usuariosDelNegocio.length);
    
    if (!data.assignedUserId || data.assignedUserId === 0) {
      console.error('❌ Usuario no seleccionado');
      console.error('   assignedUserId:', data.assignedUserId);
      console.error('   Usuarios en el sistema:', this.usuariosDelNegocio.map(u => ({ id: u.id, nombre: u.nombre_completo })));
      this.showToast('Debes seleccionar un usuario', 'error');
      return false;
    }

    // Verificar que el usuario exista en la lista
    const userExists = this.usuariosDelNegocio.some(u => u.id === data.assignedUserId);
    if (!userExists) {
      console.error('❌ Usuario seleccionado no existe en la lista');
      console.error('   ID buscado:', data.assignedUserId);
      console.error('   IDs disponibles:', this.usuariosDelNegocio.map(u => u.id));
      this.showToast('El usuario seleccionado no es válido', 'error');
      return false;
    }
    console.log('✅ Usuario válido');

    console.log('✅ ===== VALIDACIÓN EXITOSA =====');
    return true;
  }

  // ========================================
  // GUARDAR (CREAR/ACTUALIZAR)
  // ========================================

  public saveService(): void {
    console.log('💾 ===== GUARDAR SERVICIO =====');

    if (!this.validateForm()) {
      console.error('❌ Validación fallida');
      return;
    }

    const formData = this.getFormData();
    console.log('📝 Datos del formulario:', formData);

    if (this.currentEditingId) {
      this.updateService(this.currentEditingId, formData);
    } else {
      this.createService(formData);
    }
  }

  private createService(formData: ServiceFormData): void {
    console.log(`➕ ===== CREAR SERVICIO EN ${this.negocioNombre} =====`);
    this.isLoading = true;

    const apiData = this.transformToApiRequest(formData);
    console.log('📤 PAYLOAD FINAL:', JSON.stringify(apiData, null, 2));

    this.servicesService.create(apiData).subscribe({
      next: (response: any) => {
        console.log('✅ ===== RESPUESTA DEL SERVIDOR =====');
        console.log(response);

        const newService = this.transformService(response);
        this.services.unshift(newService);
        this.filteredServices = [...this.services];

        this.showToast('Servicio creado exitosamente', 'success');
        this.closeServiceModal();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ ===== ERROR AL CREAR =====');
        console.error('Status:', error.status);
        console.error('Error:', error.error);
        console.error('Message:', error.message);

        let msg = 'Error al crear servicio';
        if (error.status === 0) {
          msg = 'No se puede conectar con el servidor. Verifica que Laravel esté corriendo en puerto 8000.';
        } else if (error.error?.message) {
          msg = error.error.message;
        } else if (error.error?.errors) {
          const firstError = Object.values(error.error.errors)[0];
          msg = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (error.message) {
          msg = error.message;
        }

        this.showToast(msg, 'error');
        this.isLoading = false;
      }
    });
  }

  private updateService(id: string | number, formData: ServiceFormData): void {
    console.log(`🔄 ===== ACTUALIZAR SERVICIO ${id} =====`);
    this.isLoading = true;

    const apiData = this.transformToApiRequest(formData);
    console.log('📤 PAYLOAD:', JSON.stringify(apiData, null, 2));

    this.servicesService.update(id, apiData).subscribe({
      next: (response: any) => {
        console.log('✅ ===== ACTUALIZADO =====');
        console.log(response);

        const updated = this.transformService(response);
        const index = this.services.findIndex(s => s.id.toString() === id.toString());

        if (index !== -1) {
          this.services[index] = updated;
          this.filteredServices = [...this.services];
        }

        this.showToast('Servicio actualizado exitosamente', 'success');
        this.closeServiceModal();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error actualizar:', error);
        this.showToast('Error al actualizar servicio', 'error');
        this.isLoading = false;
      }
    });
  }

  // ========================================
  // ELIMINAR
  // ========================================

  public confirmDelete(): void {
    if (!this.currentEditingId) return;

    console.log(`🗑️ ===== ELIMINAR SERVICIO ${this.currentEditingId} =====`);
    this.isLoading = true;

    this.servicesService.delete(this.currentEditingId).subscribe({
      next: () => {
        console.log('✅ Eliminado exitosamente');

        this.services = this.services.filter(s =>
          s.id.toString() !== this.currentEditingId?.toString()
        );
        this.filteredServices = this.filteredServices.filter(s =>
          s.id.toString() !== this.currentEditingId?.toString()
        );

        this.showToast('Servicio eliminado exitosamente', 'success');
        this.closeDeleteModal();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error eliminar:', error);
        this.showToast('Error al eliminar servicio', 'error');
        this.isLoading = false;
      }
    });
  }

  // ========================================
  // TOAST MESSAGES
  // ========================================

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const existing = document.querySelector('.message-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `message-toast message-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
  }

  // ========================================
  // DEBUG
  // ========================================

  public debug(): void {
    console.log('🔍 ===== DEBUG =====');
    console.log('Negocio:', this.negocioId, this.negocioNombre);
    console.log('Services:', this.services.length);
    console.log('Filtered:', this.filteredServices.length);
    console.log('Usuarios disponibles:', this.usuariosDelNegocio.length);
    console.log('====================');
  }

  public debugForm(): void {
    console.log('🔍 ===== DEBUG COMPLETO DEL FORMULARIO =====');
    
    const name = document.getElementById('serviceName') as HTMLInputElement;
    const duration = document.getElementById('serviceDuration') as HTMLInputElement;
    const price = document.getElementById('servicePrice') as HTMLInputElement;
    const status = document.getElementById('serviceStatus') as HTMLSelectElement;
    const user = document.getElementById('serviceUser') as HTMLSelectElement;

    console.log('📋 Elementos del DOM:');
    console.log('   serviceName:', name ? 'Encontrado' : 'NO ENCONTRADO');
    console.log('   serviceDuration:', duration ? 'Encontrado' : 'NO ENCONTRADO');
    console.log('   servicePrice:', price ? 'Encontrado' : 'NO ENCONTRADO');
    console.log('   serviceStatus:', status ? 'Encontrado' : 'NO ENCONTRADO');
    console.log('   serviceUser:', user ? 'Encontrado' : 'NO ENCONTRADO');

    if (name) console.log('   → Nombre value:', name.value);
    if (duration) console.log('   → Duración value:', duration.value);
    if (price) console.log('   → Precio value:', price.value);
    if (status) console.log('   → Estado value:', status.value);
    if (user) {
      console.log('   → Usuario value:', user.value);
      console.log('   → Usuario selectedIndex:', user.selectedIndex);
      console.log('   → Usuario options:', Array.from(user.options).map(o => ({ value: o.value, text: o.text })));
    }

    console.log('👥 Usuarios cargados en el componente:', this.usuariosDelNegocio.length);
    if (this.usuariosDelNegocio.length > 0) {
      console.log('   Primer usuario:', this.usuariosDelNegocio[0]);
    }

    console.log('============================================');
  }
}