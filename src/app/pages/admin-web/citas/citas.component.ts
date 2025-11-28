import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, Appointment } from '../../../services/appointments.service';
import { ScheduleService, Staff } from '../../../services/schedule.service';
import { ServicesService } from '../../../services/services.service';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';



interface CalendarDay {
  number: number;
  date: Date;
  selected?: boolean;
  otherMonth?: boolean;
  disabled?: boolean;
  isToday?: boolean;
}

interface ServiceOption {
  id: number;
  nombre: string;
  precio: number;
  tiempo_estimado: number;
  duracion_formato?: string;
}

interface StaffOption {
  id: number;
  nombre: string;
  apellidos: string;
  nombre_completo: string;
  rol: string;
}

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, AdminWeb, ContenidoComponent]
})
export class CitasComponent implements OnInit {

  currentView: 'list' | 'create' = 'list';
  isLoading = false;
  isEditing = false;
  editingId: number | null = null;

  successMessage = '';
  errorMessage = '';

  appointments: Appointment[] = [];
  stats = { reserved: 0, confirmed: 0, cancelled: 0 };

  // 🔥 NEGOCIO ACTUAL
  currentBusinessId: number = 1;
  currentBusinessName: string = '';

  // 🔥 LISTAS DINÁMICAS
  availableServices: ServiceOption[] = [];
  availableStaff: StaffOption[] = [];

  form = {
    clientDocType: 'CC',
    clientDocNumber: '',
    clientName: '',
    clientEmail: '',
    clientBirthDate: '',
    clientPhone: '',
    appointmentService: '',
    appointmentStaff: '',
    appointmentObservations: '',
    selectedDay: 0,
    selectedMonth: '',
    selectedTime: ''
  };

  calendarDays: CalendarDay[] = [];
  formCalendarDays: CalendarDay[] = [];
  currentMonthYear = '';
  currentMonthForm = '';
  selectedDateText = '';

  staffList: Staff[] = [];
  workingDays: string[] = [];
  availableTimeSlots: Array<{ time: string; display: string; selected?: boolean }> = [];

  selectedService: { price: number; duration: string; recommendation: string } | null = null;

  private allTimeSlots = [
    { time: '09:00', display: '9:00 am' },
    { time: '09:30', display: '9:30 am' },
    { time: '10:00', display: '10:00 am' },
    { time: '10:30', display: '10:30 am' },
    { time: '11:00', display: '11:00 am' },
    { time: '11:30', display: '11:30 am' },
    { time: '12:00', display: '12:00 pm' },
    { time: '14:00', display: '2:00 pm' },
    { time: '14:30', display: '2:30 pm' },
    { time: '15:00', display: '3:00 pm' },
    { time: '15:30', display: '3:30 pm' },
    { time: '16:00', display: '4:00 pm' },
    { time: '16:30', display: '4:30 pm' },
    { time: '17:00', display: '5:00 pm' },
    { time: '17:30', display: '5:30 pm' },
    { time: '18:00', display: '6:00 pm' }
  ];

  private currentMonthDate = new Date();

 constructor(
  private appointmentsService: AppointmentsService,
  private scheduleService: ScheduleService,
  private servicesService: ServicesService,
  private usersService: UsersService,
  private authService: AuthService,
  private notificationService: NotificationService // 🔥 AGREGAR ESTA LÍNEA
) {}

  ngOnInit(): void {
    console.log('🚀 ========================================');
    console.log('🚀 CitasComponent inicializado');
    console.log('🚀 ========================================');

    // Obtener información del negocio actual
    const user = this.authService.getCurrentUser();
    if (user?.negocios_id) {
      this.currentBusinessId = user.negocios_id;
      this.currentBusinessName = user.business?.nombre || `Negocio ${this.currentBusinessId}`;
      console.log(`🏢 Negocio actual: ${this.currentBusinessName} (ID: ${this.currentBusinessId})`);
    } else {
      console.warn('⚠️ No se pudo obtener el negocio actual del usuario');
    }

    console.log('📋 Inicializando calendarios...');
    this.initCalendars();

    console.log('📡 Cargando datos iniciales...');
    this.loadServicesAndStaff();
    this.loadAppointments();

    console.log('✅ Inicialización completada');
  }

  // ============================================
  // 🔥 CARGAR SERVICIOS Y PERSONAL DEL NEGOCIO
  // ============================================

  private loadServicesAndStaff(): void {
    console.log('📡 Cargando servicios y personal del negocio...');
    console.log('🏢 Negocio actual:', this.currentBusinessName, '(ID:', this.currentBusinessId, ')');

    // 1️⃣ Cargar SERVICIOS del negocio actual
    this.servicesService.getAll().subscribe({
      next: (response: any) => {
        let services = Array.isArray(response) ? response : (response.data || []);

        this.availableServices = services
          .filter((s: any) =>
            s.negocios_id === this.currentBusinessId &&
            (s.estados_id === 1 || s.status?.nombre === 'Activo')
          )
          .map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            precio: s.precio,
            tiempo_estimado: s.tiempo_estimado,
            duracion_formato: this.formatDuration(s.tiempo_estimado)
          }));

        console.log(`✅ ${this.availableServices.length} servicios cargados del negocio`);
      },
      error: (err) => {
        console.error('❌ Error cargando servicios:', err);
        this.showError('Error al cargar servicios');
      }
    });

    // 2️⃣ Cargar PERSONAL del negocio actual (empleados + administradores)
    this.usersService.getStaffByBusiness(this.currentBusinessId).subscribe({
      next: (staffData: any) => {
        console.log('📥 Personal recibido del negocio:', staffData);

      // Transformar datos del personal
        this.availableStaff = staffData.map((u: any) => ({
          id: u.id,
          nombre: u.nombre.split(' ')[0] || '',
          apellidos: u.nombre.split(' ').slice(1).join(' ') || '',
          nombre_completo: u.nombre,
          rol: u.rol?.nombre || 'Personal'
        }));

        console.log(`✅ ${this.availableStaff.length} personal cargado:`, this.availableStaff);

        // 3️⃣ Preparar lista para ScheduleService (formato Staff)
        this.staffList = this.availableStaff.map(staff => ({
          id: staff.id.toString(),
          name: staff.nombre_completo,
          displayName: staff.nombre_completo,
          role: staff.rol
        }));

        console.log('📋 Lista de personal para horarios:', this.staffList);

        // 4️⃣ Actualizar el ScheduleService con el personal del negocio
        this.scheduleService.setStaffList(this.staffList);
      },
      error: (err) => {
        console.error('❌ Error cargando personal del negocio:', err);
        this.showError('Error al cargar personal del negocio');
        this.availableStaff = [];
        this.staffList = [];
      }
    });
  }

  private formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}min`;
    return result.trim() || '0min';
  }

  // ============================================
  // CRUD
  // ============================================

  loadAppointments(): void {
    console.log('📋 Cargando citas...');
    this.isLoading = true;

    this.appointmentsService.getAll().subscribe({
      next: (data: Appointment[]) => {
        console.log(`✅ ${data.length} citas cargadas`);
        this.appointments = data;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Error:', err);
        this.showError(err.message || 'Error al cargar citas');
        this.isLoading = false;
      }
    });
  }

// 🔥 REEMPLAZA SOLO ESTE MÉTODO en citas.component.ts
// Línea aproximada 245-310

onSubmit(): void {
  console.log('📤 Enviando formulario...');

  if (!this.form.clientName?.trim()) {
    this.showError('El nombre es obligatorio');
    return;
  }
  if (!this.form.clientEmail?.trim()) {
    this.showError('El email es obligatorio');
    return;
  }
  if (!this.validateEmail(this.form.clientEmail)) {
    this.showError('Email inválido');
    return;
  }
  if (!this.form.appointmentService) {
    this.showError('Seleccione un servicio');
    return;
  }
  if (!this.form.appointmentStaff) {
    this.showError('Seleccione el personal');
    return;
  }
  if (!this.form.selectedDay) {
    this.showError('Seleccione una fecha');
    return;
  }
  if (!this.form.selectedTime) {
    this.showError('Seleccione una hora');
    return;
  }

  const selectedService = this.availableServices.find(s => s.id.toString() === this.form.appointmentService);
  const selectedStaff = this.availableStaff.find(st => st.id.toString() === this.form.appointmentStaff);

  if (!selectedService || !selectedStaff) {
    this.showError('Datos inválidos');
    return;
  }

  // 🔥 AGREGAR serviceId aquí
  const appointment: Appointment = {
    clientName: this.form.clientName.trim(),
    clientEmail: this.form.clientEmail.trim(),
    clientDocType: this.form.clientDocType || 'CC',
    clientDocNumber: this.form.clientDocNumber || '0000000000',
    clientBirthDate: this.form.clientBirthDate || '2000-01-01',
    clientPhone: this.form.clientPhone || '3000000000',
    serviceName: selectedService.nombre,
    serviceId: selectedService.id, // 🔥 LÍNEA AGREGADA - El ID real del servicio
    staffName: selectedStaff.nombre_completo,
    day: this.form.selectedDay,
    monthName: this.form.selectedMonth,
    time: this.form.selectedTime,
    status: 'reserved',
    nota: this.form.appointmentObservations || ''
  };

  console.log('🔍 VALIDACIÓN ANTES DE ENVIAR:');
  console.log('  ✓ serviceName:', appointment.serviceName);
  console.log('  ✓ serviceId:', appointment.serviceId, '← DEBE SER 15 o 16');

  this.isLoading = true;

  if (this.isEditing && this.editingId) {
    appointment.id = this.editingId;
    this.appointmentsService.update(this.editingId, appointment).subscribe({
      next: async () => {
        // 🔥 NOTIFICACIÓN AL ACTUALIZAR
        await this.notificationService.mostrarNotificacion(
          '✏️ Cita actualizada',
          `La cita de ${appointment.clientName} ha sido modificada`
        );

        this.showSuccess('✅ Cita actualizada');
        this.resetAndGoToList();
      },
      error: (err: any) => {
        this.showError(`Error: ${err.message}`);
        this.isLoading = false;
      }
    });
  } else {
    this.appointmentsService.create(appointment).subscribe({
      next: async (response: any) => {
        // 🔥 NOTIFICACIÓN AL CREAR CITA
        await this.notificationService.mostrarNotificacion(
          '✅ Cita creada exitosamente',
          `Cita para ${appointment.clientName} el día ${appointment.day} a las ${appointment.time}`
        );

        // 🔥 PROGRAMAR RECORDATORIO (15 minutos antes)
        const fechaCita = this.buildAppointmentDate(
          appointment.day,
          appointment.monthName,
          appointment.time
        );

        if (fechaCita) {
          await this.notificationService.notificarCitaConRecordatorio(
            `Cita: ${selectedService.nombre}`,
            `Cliente: ${appointment.clientName} con ${selectedStaff.nombre_completo}`,
            fechaCita
          );
          console.log('📅 Recordatorio programado para:', fechaCita);
        }

        this.showSuccess('✅ Cita creada');
        this.resetAndGoToList();
      },
      error: (err: any) => {
        this.showError(`Error: ${err.message}`);
        this.isLoading = false;
      }
    });
  }
}

  editAppointment(apt: Appointment): void {
    console.log('✏️ Editando:', apt);
    apt.showMenu = false;

    this.isEditing = true;
    this.editingId = apt.id || null;

    this.form = {
      clientDocType: apt.clientDocType || 'CC',
      clientDocNumber: apt.clientDocNumber || '',
      clientName: apt.clientName,
      clientEmail: apt.clientEmail || '',
      clientBirthDate: apt.clientBirthDate || '',
      clientPhone: apt.clientPhone || '',
      appointmentService: apt.serviceName,
      appointmentStaff: apt.staffName || '',
      appointmentObservations: apt.nota || '',
      selectedDay: apt.day,
      selectedMonth: apt.monthName,
      selectedTime: apt.time
    };

    this.formCalendarDays.forEach(d => d.selected = d.number === apt.day);
    this.availableTimeSlots.forEach(s => s.selected = s.time === apt.time);
    this.selectedDateText = `Día ${apt.day}`;

    if (apt.serviceName) this.onServiceChange();
    if (apt.staffName) this.onStaffChange();

    this.switchView('create');
  }
private buildAppointmentDate(day: number, monthName: string, time: string): Date | null {
  try {
    const months: { [key: string]: number } = {
      'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3,
      'MAYO': 4, 'JUNIO': 5, 'JULIO': 6, 'AGOSTO': 7,
      'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
    };

    const month = months[monthName.toUpperCase()];
    if (month === undefined) return null;

    const year = new Date().getFullYear();
    const [hours, minutes] = time.split(':').map(Number);

    const appointmentDate = new Date(year, month, day, hours, minutes);

    if (appointmentDate.getTime() > Date.now()) {
      return appointmentDate;
    }

    return null;
  } catch (error) {
    console.error('❌ Error construyendo fecha:', error);
    return null;
  }
}
  deleteAppointment(apt: Appointment): void {
    if (!apt.id) return;
    apt.showMenu = false;

    if (!confirm(`¿Eliminar cita de ${apt.clientName}?`)) return;

    this.isLoading = true;
  this.appointmentsService.delete(apt.id).subscribe({
  next: async () => {
    // 🔥 NOTIFICACIÓN AL ELIMINAR
    await this.notificationService.mostrarNotificacion(
      '🗑️ Cita eliminada',
      `La cita de ${apt.clientName} ha sido eliminada`
    );

    this.showSuccess(`✅ Cita eliminada`);
    this.loadAppointments();
  },
      error: (err: any) => {
        this.showError(`Error: ${err.message}`);
        this.isLoading = false;
      }
    });
  }

 confirmAppointment(apt: Appointment): void {
  if (!apt.id) return;
  apt.showMenu = false;

  this.isLoading = true;
  this.appointmentsService.changeStatus(apt.id, 'confirmed').subscribe({
    next: async () => {
      // 🔥 NOTIFICACIÓN AL CONFIRMAR
      await this.notificationService.mostrarNotificacion(
        '✅ Cita confirmada',
        `La cita de ${apt.clientName} está confirmada para el ${apt.day} a las ${apt.time}`
      );

      this.showSuccess('✅ Cita confirmada');
      this.loadAppointments();
    },
    error: (err: any) => {
      this.showError(`Error: ${err.message}`);
      this.isLoading = false;
    }
  });
}

cancelAppointment(apt: Appointment): void {
  if (!apt.id) return;
  apt.showMenu = false;

  const motivo = prompt('Motivo de cancelación (opcional):');

  this.isLoading = true;
  this.appointmentsService.cancel(apt.id, motivo || undefined).subscribe({
    next: async () => {
      // 🔥 NOTIFICACIÓN AL CANCELAR
      await this.notificationService.mostrarNotificacion(
        '❌ Cita cancelada',
        `La cita de ${apt.clientName} ha sido cancelada${motivo ? ': ' + motivo : ''}`
      );

      this.showSuccess('✅ Cita cancelada');
      this.loadAppointments();
    },
    error: (err: any) => {
      this.showError(`Error: ${err.message}`);
      this.isLoading = false;
    }
  });
}

  // ============================================
  // CALENDARIO
  // ============================================

  private initCalendars(): void {
    this.buildListCalendar();
    this.buildFormCalendar();
  }

  private buildListCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                    'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

    this.currentMonthYear = `${months[month]} ${year}`;

    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const offset = (firstDayIndex + 6) % 7;
    const today = new Date();

    const days: CalendarDay[] = [];

    for (let i = 0; i < offset; i++) {
      days.push({
        number: 0,
        date: new Date(year, month, -offset + i + 1),
        otherMonth: true
      });
    }

    for (let d = 1; d <= lastDay; d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        number: d,
        date: dateObj,
        isToday: today.getFullYear() === year &&
                 today.getMonth() === month &&
                 today.getDate() === d
      });
    }

    this.calendarDays = days;
  }

  private buildFormCalendar(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                    'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

    this.currentMonthForm = `${months[month]} ${year}`;

    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const offset = (firstDayIndex + 6) % 7;

    const days: CalendarDay[] = [];

    for (let i = 0; i < offset; i++) {
      days.push({
        number: 0,
        date: new Date(year, month, -offset + i + 1),
        otherMonth: true
      });
    }

    for (let d = 1; d <= lastDay; d++) {
      days.push({
        number: d,
        date: new Date(year, month, d)
      });
    }

    this.formCalendarDays = days;
  }

  previousMonth(): void {
    this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() - 1);
    this.buildListCalendar();
  }

  nextMonth(): void {
    this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + 1);
    this.buildListCalendar();
  }

  selectDate(day: CalendarDay): void {
    if (day.otherMonth || day.disabled) {
      this.showError('No puede seleccionar este día');
      return;
    }

    this.formCalendarDays.forEach(d => d.selected = false);
    day.selected = true;

    this.form.selectedDay = day.number;
    this.form.selectedMonth = this.currentMonthForm.split(' ')[0];
    this.selectedDateText = `Día ${day.number}`;

    if (this.form.appointmentStaff) {
      this.updateTimeSlotsForDay(day.number);
    }
  }

  selectTime(slot: { time: string; display: string; selected?: boolean }): void {
    this.availableTimeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    this.form.selectedTime = slot.time;
  }

  // ============================================
  // HORARIOS Y PERSONAL
  // ============================================

  onStaffChange(): void {
    const staffId = this.form.appointmentStaff;

    console.log('👤 Personal seleccionado:', staffId);

    if (!staffId) {
      console.log('⚠️ No hay personal seleccionado, mostrando todos los horarios');
      this.availableTimeSlots = [...this.allTimeSlots];
      this.workingDays = [];
      this.formCalendarDays.forEach(d => d.disabled = false);
      return;
    }

    // Obtener información del personal seleccionado
    const selectedStaff = this.availableStaff.find(s => s.id.toString() === staffId);
    if (selectedStaff) {
      console.log('✅ Personal encontrado:', selectedStaff.nombre_completo, '- Rol:', selectedStaff.rol);
    }

    // Cargar días laborables del personal
    console.log('📅 Cargando días laborables...');
    this.scheduleService.getWorkingDays(staffId).subscribe({
      next: (days: string[]) => {
        console.log('✅ Días laborables recibidos:', days);
        this.workingDays = days;
        this.markDisabledDays(days);

        if (this.form.selectedDay) {
          console.log('🔄 Actualizando horarios para el día seleccionado:', this.form.selectedDay);
          this.updateTimeSlotsForDay(this.form.selectedDay);
        }
      },
      error: (err: any) => {
        console.error('❌ Error cargando días laborables:', err);
        this.showError('No se pudieron cargar los horarios del personal');
        this.workingDays = [];
      }
    });
  }

  private markDisabledDays(workingDays: string[]): void {
    const daysMap: { [key: string]: number } = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sabado': 6
    };

    const workingDayIndices = workingDays
      .map(d => daysMap[d.toLowerCase()])
      .filter(i => i !== undefined);

    this.formCalendarDays.forEach(day => {
      if (!day.otherMonth) {
        const dayIndex = day.date.getDay();
        day.disabled = workingDayIndices.length > 0 &&
                       !workingDayIndices.includes(dayIndex);
      }
    });
  }

  private updateTimeSlotsForDay(dayNumber: number): void {
    const staffId = this.form.appointmentStaff;
    if (!staffId) return;

    const date = this.formCalendarDays.find(d => d.number === dayNumber)?.date;
    if (!date) return;

    const dayNames = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
    const dayName = dayNames[date.getDay()];

    this.scheduleService.getAvailableTimeSlotsForDay(staffId, dayName).subscribe({
      next: (slots: string[]) => {
        this.availableTimeSlots = this.allTimeSlots.filter(s =>
          slots.includes(s.time)
        );

        if (this.availableTimeSlots.length === 0) {
          this.showError(`No hay horarios disponibles para ${dayName}`);
        }
      },
      error: (err: any) => {
        console.error('❌ Error:', err);
        this.availableTimeSlots = [...this.allTimeSlots];
      }
    });
  }

  onServiceChange(): void {
    const serviceId = this.form.appointmentService;
    const service = this.availableServices.find(s => s.id.toString() === serviceId);

    if (service) {
      this.selectedService = {
        price: service.precio,
        duration: service.duracion_formato || this.formatDuration(service.tiempo_estimado),
        recommendation: 'Recomendación del servicio'
      };
    } else {
      this.selectedService = null;
    }
  }

  getStaffName(staffId: string): string {
    const staff = this.availableStaff.find(s => s.id.toString() === staffId);
    return staff?.nombre_completo || staffId;
  }

  // ============================================
  // UTILIDADES
  // ============================================

  switchView(view: 'list' | 'create'): void {
    this.currentView = view;
    this.clearMessages();

    if (view === 'create' && !this.isEditing) {
      this.resetForm();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    this.form = {
      clientDocType: 'CC',
      clientDocNumber: '',
      clientName: '',
      clientEmail: '',
      clientBirthDate: '',
      clientPhone: '',
      appointmentService: '',
      appointmentStaff: '',
      appointmentObservations: '',
      selectedDay: 0,
      selectedMonth: '',
      selectedTime: ''
    };

    this.formCalendarDays.forEach(d => d.selected = false);
    this.availableTimeSlots.forEach(s => s.selected = false);
    this.selectedDateText = '';
    this.selectedService = null;
    this.workingDays = [];
    this.clearMessages();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingId = null;
    this.resetForm();
    this.switchView('list');
  }

  reloadData(): void {
    this.loadAppointments();
  }

  private resetAndGoToList(): void {
    this.isEditing = false;
    this.editingId = null;
    this.resetForm();
    this.switchView('list');
    this.loadAppointments();
  }

  private calculateStats(): void {
    this.stats = {
      reserved: this.appointments.filter(a => a.status === 'reserved').length,
      confirmed: this.appointments.filter(a => a.status === 'confirmed').length,
      cancelled: this.appointments.filter(a => a.status === 'cancelled').length
    };
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  toggleMenu(event: Event, apt: any): void {
    event.stopPropagation();
    this.appointments.forEach(a => {
      if (a !== apt) a.showMenu = false;
    });
    apt.showMenu = !apt.showMenu;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.appointments.forEach(a => a.showMenu = false);
  }

  trackDay(_: number, item: CalendarDay): number {
    return item.date.getTime();
  }

  trackAppointment(_: number, item: Appointment): number | undefined {
    return item.id;
  }

  trackSlot(_: number, item: { time: string }): string {
    return item.time;
  }
}
