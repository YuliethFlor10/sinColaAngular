import { Component, ElementRef, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AppointmentsService } from '../../../services/appointments.service';
import { ServicesService } from '../../../services/services.service';
import { UsersService } from '../../../services/users.service';

@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FormularioComponent implements AfterViewInit {
  currentStep = 1;
  currentDate = new Date();
  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  formData: any = {};

  // 🔥 NEGOCIO SINCOLA - ID FIJO
  private readonly SINCOLA_BUSINESS_ID = 6;

  // 🔥 SERVICIOS Y PERSONAL DINÁMICOS
  serviciosDisponibles: any[] = [];
  personalDisponible: any[] = [];

  @ViewChild('personalForm', { static: false }) personalForm!: ElementRef<HTMLFormElement>;
  @ViewChild('appointmentForm', { static: false }) appointmentForm!: ElementRef<HTMLFormElement>;

  constructor(
    private appointmentsService: AppointmentsService,
    private servicesService: ServicesService,
    private usersService: UsersService
  ) {}

  ngAfterViewInit() {
    this.setupEventListeners();
    this.generateCalendar();
    this.cargarServiciosYPersonal(); // 🔥 Cargar datos de SinCola
  }

  // ============================================
  // 🔥 CARGAR SERVICIOS Y PERSONAL DE SINCOLA
  // ============================================

  cargarServiciosYPersonal() {
    console.log(`📡 Cargando servicios y personal del negocio SinCola (ID: ${this.SINCOLA_BUSINESS_ID})...`);

    // Cargar servicios activos de SinCola
    this.servicesService.getAll().subscribe({
      next: (response: any) => {
        console.log('✅ Servicios recibidos:', response);

        let servicios = Array.isArray(response) ? response : (response?.data || []);

        // 🔥 Filtrar SOLO servicios de SinCola (ID: 6)
        this.serviciosDisponibles = servicios.filter((s: any) =>
          s.negocios_id === this.SINCOLA_BUSINESS_ID &&
          (s.estados_id === 1 || s.status?.nombre === 'Activo')
        );

        console.log(`✅ ${this.serviciosDisponibles.length} servicios disponibles de SinCola:`, this.serviciosDisponibles);
        this.poblarSelectServicios();
      },
      error: (err) => console.error('❌ Error cargando servicios:', err)
    });

    // Cargar personal de SinCola (Admins + Empleados)
    this.usersService.getStaffForServices().subscribe({
      next: (response: any) => {
        console.log('✅ Personal recibido:', response);

        let usuarios = Array.isArray(response) ? response : (response?.data || []);

        // 🔥 Filtrar SOLO personal de SinCola (ID: 6)
        this.personalDisponible = usuarios.filter((u: any) =>
          u.negocios_id === this.SINCOLA_BUSINESS_ID &&
          (u.roles_id === 1 || u.roles_id === 3) && // 1=Admin, 3=Empleado
          (u.estados_id === 1 || u.status?.nombre === 'Activo')
        );

        console.log(`✅ ${this.personalDisponible.length} miembros del staff de SinCola:`, this.personalDisponible);
        this.poblarSelectPersonal();
      },
      error: (err) => console.error('❌ Error cargando personal:', err)
    });
  }

  // 🔥 Poblar select de servicios
  poblarSelectServicios() {
    const select = document.getElementById('appointmentType') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">Procedimiento a realizar</option>';

    this.serviciosDisponibles.forEach(servicio => {
      const option = document.createElement('option');
      option.value = servicio.id.toString();
      option.textContent = servicio.nombre;
      option.setAttribute('data-precio', servicio.precio);
      option.setAttribute('data-duracion', servicio.tiempo_estimado);
      select.appendChild(option);
    });

    console.log(`✅ ${this.serviciosDisponibles.length} servicios agregados al select`);
  }

  // 🔥 Poblar select de personal
  poblarSelectPersonal() {
    const select = document.getElementById('staff') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione al personal de preferencia</option>';

    this.personalDisponible.forEach(usuario => {
      const option = document.createElement('option');
      option.value = usuario.id.toString();
      option.textContent = `${usuario.nombres} ${usuario.apellidos}`.trim();
      select.appendChild(option);
    });

    // Agregar opción "cualquier disponible"
    const anyOption = document.createElement('option');
    anyOption.value = 'cualquiera';
    anyOption.textContent = 'Cualquier especialista disponible';
    select.appendChild(anyOption);

    console.log(`✅ ${this.personalDisponible.length} miembros del staff agregados al select`);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners() {
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
      personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStep1Submit();
      });
    }

    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStep2Submit();
      });
    }

    const prevMonth = document.getElementById('prevMonth');
    if (prevMonth) {
      prevMonth.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
      });
    }

    const nextMonth = document.getElementById('nextMonth');
    if (nextMonth) {
      nextMonth.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
      });
    }

    this.setupTimeSlotListeners();

    const appointmentType = document.getElementById('appointmentType');
    if (appointmentType) {
      appointmentType.addEventListener('change', (e: any) => {
        this.updateServiceInfo(e.target.value);
      });
    }
  }

  setupTimeSlotListeners() {
    document.querySelectorAll('.time-slot').forEach((slot) => {
      slot.addEventListener('click', (e: any) => {
        this.selectTimeSlot(e.target);
      });
    });
  }

  // ============================================
  // PASO 1: DATOS PERSONALES
  // ============================================

  handleStep1Submit() {
    const form = document.getElementById('personalForm') as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.formData.docType = (document.getElementById('docType') as HTMLSelectElement).value;
    this.formData.docNumber = (document.getElementById('docNumber') as HTMLInputElement).value;
    this.formData.fullName = (document.getElementById('fullName') as HTMLInputElement).value;
    this.formData.birthDate = (document.getElementById('birthDate') as HTMLInputElement).value;
    this.formData.email = (document.getElementById('email') as HTMLInputElement).value;
    this.formData.phone = (document.getElementById('phone') as HTMLInputElement).value;

    console.log('✅ Paso 1 completado:', this.formData);
    this.goToStep(2);
  }

  // ============================================
  // PASO 2: DATOS DE LA CITA
  // ============================================

  handleStep2Submit() {
    const form = document.getElementById('appointmentForm') as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!this.selectedDate) {
      alert('Por favor selecciona una fecha');
      return;
    }

    if (!this.selectedTime) {
      alert('Por favor selecciona una hora');
      return;
    }

    const servicioId = (document.getElementById('appointmentType') as HTMLSelectElement).value;
    const staffId = (document.getElementById('staff') as HTMLSelectElement).value;

    if (!servicioId) {
      alert('Por favor selecciona un servicio');
      return;
    }

    if (!staffId) {
      alert('Por favor selecciona el personal');
      return;
    }

    // 🔥 Buscar datos completos del servicio y personal
    const servicioSeleccionado = this.serviciosDisponibles.find(s => s.id.toString() === servicioId);
    const personalSeleccionado = this.personalDisponible.find(p => p.id.toString() === staffId);

    this.formData.appointmentType = servicioId;
    this.formData.serviceName = servicioSeleccionado?.nombre || 'Servicio';
    this.formData.staffId = staffId === 'cualquiera' ? null : parseInt(staffId);
    this.formData.staffName = personalSeleccionado
      ? `${personalSeleccionado.nombres} ${personalSeleccionado.apellidos}`.trim()
      : 'Cualquier especialista';
    this.formData.date = this.selectedDate;
    this.formData.time = this.selectedTime;
    this.formData.observations = (document.getElementById('observations') as HTMLTextAreaElement).value;
    this.formData.servicioData = servicioSeleccionado;

    console.log('✅ Paso 2 completado:', this.formData);
    this.processReservation();
  }

  // ============================================
  // PROCESAR RESERVA
  // ============================================

  processReservation() {
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loadingOverlay';
    loadingMessage.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; align-items: center;
      justify-content: center; color: white; font-size: 18px; z-index: 999;
      flex-direction: column; gap: 20px;
    `;
    loadingMessage.innerHTML = `
      <div style="font-size: 40px;">⏳</div>
      <div>Procesando tu reserva...</div>
      <div style="font-size: 14px; opacity: 0.8;">Enviando correo de confirmación</div>
    `;
    document.body.appendChild(loadingMessage);

    // 🔥 DATOS CORRECTOS PARA LA API - NEGOCIO SINCOLA (ID: 6)
    const appointmentData = {
      nombre: this.formData.fullName,
      email: this.formData.email,
      tipo_documento: this.formData.docType,
      numero_documento: this.formData.docNumber,
      fecha_nacimiento: this.formData.birthDate,
      numero_telefono: this.formData.phone,
      tipo_cita: this.formData.serviceName,
      personal_servicio: this.formData.staffName,
      fecha_cita: this.formatDate(this.formData.date),
      hora_cita: this.formData.time,
      nota: this.formData.observations || '',
      negocios_id: this.SINCOLA_BUSINESS_ID, // 🔥 SINCOLA FIJO
      servicios_id: parseInt(this.formData.appointmentType),
      tiempo_estimado: this.formData.servicioData?.tiempo_estimado || 60,
      estados_id: 1 // Reservada
    };

    console.log('📤 Enviando cita a SinCola:', appointmentData);

    this.appointmentsService.createFromForm(appointmentData).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de la API:', response);

        const overlay = document.getElementById('loadingOverlay');
        if (overlay) document.body.removeChild(overlay);

        if (response.email_sent) {
          console.log('📧 Correo enviado exitosamente');
        } else {
          console.warn('⚠️ Cita creada pero el correo no se pudo enviar:', response.email_error);
        }

        this.showConfirmationModal();
      },
      error: (error: any) => {
        console.error('❌ Error al crear la cita:', error);

        const overlay = document.getElementById('loadingOverlay');
        if (overlay) document.body.removeChild(overlay);

        let errorMessage = 'Ocurrió un error al procesar tu reserva. Por favor intenta nuevamente.';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert('❌ ' + errorMessage);
      }
    });
  }

  // ============================================
  // NAVEGACIÓN ENTRE PASOS
  // ============================================

  goToStep(step: number) {
    const currentStepEl = document.getElementById(`step${this.currentStep}`);
    if (currentStepEl) currentStepEl.classList.remove('active');

    const nextStepEl = document.getElementById(`step${step}`);
    if (nextStepEl) nextStepEl.classList.add('active');

    this.currentStep = step;
  }

  // ============================================
  // CALENDARIO
  // ============================================

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;

    calendarDays.innerHTML = '';

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = date.getDate().toString();

      if (date.getMonth() !== month) {
        dayElement.classList.add('other-month');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (
        this.selectedDate &&
        date.getDate() === this.selectedDate.getDate() &&
        date.getMonth() === this.selectedDate.getMonth() &&
        date.getFullYear() === this.selectedDate.getFullYear()
      ) {
        dayElement.classList.add('selected');
      }

      if (date < today) {
        dayElement.style.opacity = '0.3';
        dayElement.style.cursor = 'not-allowed';
      } else {
        dayElement.addEventListener('click', () => {
          this.selectedDate = date;
          this.generateCalendar();

          const options: Intl.DateTimeFormatOptions = {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          };

          const selectedDateText = document.getElementById('selectedDateText');
          if (selectedDateText) {
            selectedDateText.textContent = date.toLocaleDateString('es-ES', options);
          }
        });
      }

      calendarDays.appendChild(dayElement);
    }
  }

  // ============================================
  // SELECCIÓN DE HORA
  // ============================================

  selectTimeSlot(element: HTMLElement) {
    document.querySelectorAll('.time-slot.selected').forEach((slot) => {
      slot.classList.remove('selected');
    });

    element.classList.add('selected');
    this.selectedTime = element.getAttribute('data-time');
  }

  // ============================================
  // ACTUALIZAR INFO DEL SERVICIO
  // ============================================

  updateServiceInfo(serviceId: string) {
    const servicio = this.serviciosDisponibles.find(s => s.id.toString() === serviceId);

    if (!servicio) return;

    const serviceInfoElement = document.querySelector('.service-info');
    if (serviceInfoElement) {
      const duracionHoras = Math.floor(servicio.tiempo_estimado / 60);
      const duracionMinutos = servicio.tiempo_estimado % 60;
      let duracionTexto = '';

      if (duracionHoras > 0) duracionTexto += `${duracionHoras} H `;
      if (duracionMinutos > 0) duracionTexto += `${duracionMinutos} min`;

      serviceInfoElement.innerHTML = `
        <span class="price">Valor: $${servicio.precio.toLocaleString('es-CO')}</span>
        <span class="duration">Duración: ${duracionTexto}</span>
        <span class="recommendation">Recomendación: para el procedimiento a realizar</span>
      `;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  resetForm() {
    this.goToStep(1);
    (document.getElementById('personalForm') as HTMLFormElement)?.reset();
    (document.getElementById('appointmentForm') as HTMLFormElement)?.reset();
    this.selectedDate = null;
    this.selectedTime = null;
    this.formData = {};

    document.querySelectorAll('.calendar-day.selected').forEach((day) => {
      day.classList.remove('selected');
    });

    document.querySelectorAll('.time-slot.selected').forEach((slot) => {
      slot.classList.remove('selected');
    });

    const selectedDateText = document.getElementById('selectedDateText');
    if (selectedDateText) selectedDateText.textContent = 'Día seleccionado';
  }
}

// Función global para cerrar el modal
export function closeConfirmationModal() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = 'auto';

  const comp = (window as any).formularioComponentInstance;
  if (comp) comp.resetForm();
}
