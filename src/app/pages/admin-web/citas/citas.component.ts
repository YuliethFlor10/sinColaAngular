import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, CreateAppointmentData, MappedAppointment } from '../../../services/appointments.service';
import { AdminWeb } from "../admin-web";

export interface AppointmentForm {
  clientDocType: string;
  clientDocNumber: string;
  clientName: string;
  clientEmail: string;
  clientBirthDate: string;
  clientPhone: string;
  appointmentService: string;
  appointmentStaff: string;
  appointmentObservations: string;
}

interface CalendarDay {
  number: number;
  selected: boolean;
  otherMonth: boolean;
  hasAppointments?: boolean;
}



interface TimeSlot {
  time: string;
  display: string;
  selected: boolean;
}

interface ServiceInfo {
  price: string;
  duration: string;
  recommendation: string;
}

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContenidoComponent,
    AdminWeb
  ]
})
export class CitasComponent implements OnInit {
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isEditing: boolean = false;

  // trackBy para *ngFor en el HTML
  trackDay(index: number, item: CalendarDay): number { return item.number; }
  trackAppointment(index: number, item: MappedAppointment): string | number { return item.id; }
  trackSlot(index: number, item: TimeSlot): string { return item.time; }

  // Control de vistas
  currentView: 'list' | 'create' = 'list';

  // Datos para la vista de lista
  currentMonth: string = 'MAYO 2025';

  stats = {
    reserved: 0,
    confirmed: 0,
    cancelled: 0
  };

  // Lista de citas
  appointments: MappedAppointment[] = [];
  selectedAppointment: MappedAppointment | null = null;

  calendarDays: CalendarDay[] = [];

  // Datos para el formulario
  currentMonthForm: string = 'MAYO 2025';
  selectedDateText: string = '';

  appointmentForm: AppointmentForm = {
    clientDocType: '',
    clientDocNumber: '',
    clientName: '',
    clientEmail: '',
    clientBirthDate: '',
    clientPhone: '',
    appointmentService: '',
    appointmentStaff: '',
    appointmentObservations: ''
  };

  formCalendarDays: CalendarDay[] = [];

  timeSlots: TimeSlot[] = [
    { time: '9:00', display: '9:00 AM', selected: false },
    { time: '9:30', display: '9:30 AM', selected: false },
    { time: '10:30', display: '10:30 AM', selected: false },
    { time: '11:00', display: '11:00 AM', selected: false },
    { time: '14:30', display: '2:30 PM', selected: false },
    { time: '15:00', display: '3:00 PM', selected: false },
    { time: '15:30', display: '3:30 PM', selected: false },
    { time: '17:30', display: '5:30 PM', selected: false }
  ];

  selectedService: ServiceInfo | null = null;

  private services: { [key: string]: ServiceInfo } = {
    manicure: {
      price: '50.000',
      duration: '1 H',
      recommendation: 'para el procedimiento a realizar'
    },
    pedicure: {
      price: '65.000',
      duration: '1.5 H',
      recommendation: 'traer sandalias abiertas'
    },
    gelish: {
      price: '80.000',
      duration: '2 H',
      recommendation: 'no usar cremas 24h antes'
    },
    acrilicas: {
      price: '120.000',
      duration: '3 H',
      recommendation: 'proceso de larga duración'
    },
    pestanas: {
      price: '90.000',
      duration: '2.5 H',
      recommendation: 'no usar maquillaje en ojos'
    }
  };

  constructor(private appointmentsService: AppointmentsService) {}

  ngOnInit(): void {
    console.log('🚀 CitasComponent iniciado - Versión corregida para MySQL');
    this.generateCalendarDays();
    this.generateFormCalendarDays();
    this.loadAppointments();
  }

  // CARGAR CITAS DESDE EL API - VERSIÓN MEJORADA
  loadAppointments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('📋 Cargando citas desde MySQL...');

    this.appointmentsService.getAll().subscribe({
      next: (appointments: MappedAppointment[]) => {
        console.log('✅ Citas cargadas exitosamente desde MySQL:', appointments.length, 'citas');
        console.log('📋 Detalle de citas:', appointments);

        this.appointments = appointments;
        this.updateStats();
        this.updateCalendarWithAppointments();
        this.isLoading = false;

        if (appointments.length === 0) {
          this.successMessage = 'No hay citas registradas en la base de datos.';
        } else {
          this.successMessage = `Se cargaron ${appointments.length} citas exitosamente.`;
        }

        // Auto-limpiar mensaje después de 3 segundos
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar citas desde MySQL:', error);
        this.errorMessage = `Error al conectar con la base de datos: ${error.message || 'Error desconocido'}`;
        this.isLoading = false;

        // Mostrar información adicional del error
        if (error.status) {
          this.errorMessage += ` (Código: ${error.status})`;
        }

        console.log('🔧 Intentando cargar datos de prueba como fallback...');
        this.loadTestData();
      }
    });
  }

  // DATOS DE PRUEBA MEJORADOS
  loadTestData(): void {
    console.log('🧪 Cargando datos de prueba (fallback)...');

    this.appointments = [
      {
        id: 9999,
        fecha: '2025-05-15T10:00:00',
        fecha_fin: '2025-05-15T11:00:00',
        clientName: 'María García (DATOS DE PRUEBA)',
        clientEmail: 'maria.garcia@test.com',
        serviceName: 'Manicure Clásico',
        staffName: 'Pepita Perez',
        day: 15,
        monthName: 'MAY',
        time: '10:00 AM',
        status: 'confirmed',
        usuarios_id: 1,
        negocios_id: 1,
        servicios_id: 1,
        estados_id: 2
      },
      {
        id: 9998,
        fecha: '2025-05-16T14:30:00',
        fecha_fin: '2025-05-16T16:00:00',
        clientName: 'Juan Pérez (DATOS DE PRUEBA)',
        clientEmail: 'juan.perez@test.com',
        serviceName: 'Pedicure Spa',
        staffName: 'Luna Lunera',
        day: 16,
        monthName: 'MAY',
        time: '2:30 PM',
        status: 'reserved',
        usuarios_id: 2,
        negocios_id: 1,
        servicios_id: 2,
        estados_id: 1
      },
      {
        id: 9997,
        fecha: '2025-05-17T11:00:00',
        fecha_fin: '2025-05-17T13:00:00',
        clientName: 'Ana López (DATOS DE PRUEBA)',
        clientEmail: 'ana.lopez@test.com',
        serviceName: 'Uñas en Gelish',
        staffName: 'Sofia Star',
        day: 17,
        monthName: 'MAY',
        time: '11:00 AM',
        status: 'cancelled',
        usuarios_id: 3,
        negocios_id: 1,
        servicios_id: 3,
        estados_id: 3
      }
    ];

    this.updateStats();
    this.updateCalendarWithAppointments();

    this.errorMessage += ' - Mostrando datos de prueba.';
  }

  // OBTENER CITA POR ID - VERSIÓN MEJORADA
  getAppointmentById(id: number | string): void {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (isNaN(numericId) || numericId <= 0) {
      console.error('❌ ID inválido:', id);
      this.errorMessage = 'ID de cita inválido';
      return;
    }

    console.log('🔍 Buscando cita por ID:', numericId);
    this.isLoading = true;

    this.appointmentsService.getById(numericId).subscribe({
      next: (appointment: MappedAppointment) => {
        console.log('✅ Cita encontrada:', appointment);
        this.selectedAppointment = appointment;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error al obtener cita por ID:', error);
        this.errorMessage = `Error al cargar la cita: ${error.message || 'No encontrada'}`;
        this.isLoading = false;
      }
    });
  }

  // CREAR/EDITAR CITA - VERSIÓN CORREGIDA
  onSubmit(): void {
    console.log('💾 INICIANDO PROCESO DE GUARDADO');
    console.log('📝 Datos del formulario:', this.appointmentForm);
    console.log('✏️ Modo edición:', this.isEditing);
    console.log('🎯 Cita seleccionada:', this.selectedAppointment);

    // Validar formulario primero
    if (!this.validateForm()) {
      console.log('❌ Validación del formulario falló');
      return;
    }

    const selectedDate = this.formCalendarDays.find(day => day.selected);
    const selectedTime = this.timeSlots.find(slot => slot.selected);

    console.log('📅 Fecha seleccionada:', selectedDate);
    console.log('🕐 Hora seleccionada:', selectedTime);

    if (!selectedDate || !selectedTime) {
      console.log('❌ Falta fecha u hora');
      this.errorMessage = 'Debe seleccionar fecha y hora para la cita';
      return;
    }

    // Construir datos para enviar
    const appointmentData: CreateAppointmentData = {
      usuarios_id: this.isEditing && this.selectedAppointment ? this.selectedAppointment.usuarios_id : 1,
      negocios_id: this.isEditing && this.selectedAppointment ? this.selectedAppointment.negocios_id : 1,
      servicios_id: this.getServiceId(this.appointmentForm.appointmentService),
      fecha: this.buildDateTime(selectedDate.number, selectedTime.time),
      fecha_fin: this.buildEndDateTime(selectedDate.number, selectedTime.time, this.appointmentForm.appointmentService),
      estados_id: this.isEditing && this.selectedAppointment ? this.selectedAppointment.estados_id : 1,
      nota: this.appointmentForm.appointmentObservations || undefined,
      tiempo_estimado: this.getServiceDuration(this.appointmentForm.appointmentService)
    };

    console.log('📤 Datos preparados para envío:', appointmentData);

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditing && this.selectedAppointment) {
      // MODO EDICIÓN
      console.log('✏️ Ejecutando actualización de cita ID:', this.selectedAppointment.id);

      this.appointmentsService.update(this.selectedAppointment.id, appointmentData).subscribe({
        next: (updatedAppointment: MappedAppointment) => {
          console.log('✅ Cita actualizada exitosamente:', updatedAppointment);

          // Actualizar en la lista local
          const index = this.appointments.findIndex(apt => apt.id === this.selectedAppointment!.id);
          if (index !== -1) {
            this.appointments[index] = updatedAppointment;
            console.log('📋 Lista local actualizada');
          }

          this.updateStats();
          this.updateCalendarWithAppointments();

          this.successMessage = `Cita de ${updatedAppointment.clientName} actualizada exitosamente`;
          this.resetFormAndView();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar cita:', error);
          this.errorMessage = `Error al actualizar la cita: ${error.error?.message || error.message || 'Error desconocido'}`;
          this.isLoading = false;
        }
      });

    } else {
      // MODO CREACIÓN
      console.log('➕ Ejecutando creación de nueva cita');

      this.appointmentsService.create(appointmentData).subscribe({
        next: (newAppointment: MappedAppointment) => {
          console.log('✅ Nueva cita creada exitosamente:', newAppointment);

          // Agregar a la lista local
          this.appointments.push(newAppointment);
          this.updateStats();
          this.updateCalendarWithAppointments();

          this.successMessage = `Cita creada exitosamente para ${newAppointment.clientName}`;
          this.resetFormAndView();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Error al crear cita:', error);
          this.errorMessage = `Error al crear la cita: ${error.error?.message || error.message || 'Verifique los datos'}`;
          this.isLoading = false;
        }
      });
    }
  }

  // TOGGLE MENU - MEJORADO
  toggleMenu(event: Event, appointment: MappedAppointment): void {
    console.log('🔽 Toggle menu para cita ID:', appointment.id, 'Cliente:', appointment.clientName);
    event.stopPropagation();

    // Cerrar otros menús
    this.appointments.forEach(apt => {
      if (apt.id !== appointment.id) {
        apt.showMenu = false;
      }
    });

    // Toggle el menú actual
    appointment.showMenu = !appointment.showMenu;
    console.log('📋 Estado del menú:', appointment.showMenu ? 'ABIERTO' : 'CERRADO');
  }

  // CONFIRMAR CITA - VERSIÓN MEJORADA
  confirmAppointment(appointment: MappedAppointment): void {
    console.log('✅ CONFIRMANDO cita ID:', appointment.id, 'para:', appointment.clientName);

    appointment.showMenu = false;

    if (appointment.status === 'confirmed') {
      console.log('⚠️ La cita ya está confirmada');
      this.errorMessage = `La cita de ${appointment.clientName} ya está confirmada`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentsService.changeStatus(appointment.id, 2).subscribe({
      next: (updatedAppointment: MappedAppointment) => {
        console.log('✅ Cita confirmada exitosamente:', updatedAppointment);

        // Actualizar en la lista local
        const index = this.appointments.findIndex(apt => apt.id === appointment.id);
        if (index !== -1) {
          this.appointments[index].status = 'confirmed';
          this.appointments[index].estados_id = 2;
          console.log('📋 Status actualizado localmente');
        }

        this.updateStats();
        this.successMessage = `✅ Cita de ${appointment.clientName} confirmada exitosamente`;
        this.isLoading = false;

        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (error: any) => {
        console.error('❌ Error al confirmar cita:', error);
        this.errorMessage = `Error al confirmar la cita de ${appointment.clientName}: ${error.message || 'Intente nuevamente'}`;
        this.isLoading = false;
      }
    });
  }

  // CANCELAR CITA - VERSIÓN MEJORADA
  cancelAppointment(appointment: MappedAppointment): void {
    console.log('❌ CANCELANDO cita ID:', appointment.id, 'para:', appointment.clientName);

    appointment.showMenu = false;

    if (appointment.status === 'cancelled') {
      console.log('⚠️ La cita ya está cancelada');
      this.errorMessage = `La cita de ${appointment.clientName} ya está cancelada`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const reason = prompt(`¿Cuál es el motivo de la cancelación de la cita de ${appointment.clientName}? (opcional)`);

    if (reason === null) {
      console.log('Cancelación abortada por el usuario');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentsService.changeStatus(appointment.id, 3).subscribe({
      next: (updatedAppointment: MappedAppointment) => {
        console.log('✅ Cita cancelada exitosamente:', updatedAppointment);

        // Actualizar en la lista local
        const index = this.appointments.findIndex(apt => apt.id === appointment.id);
        if (index !== -1) {
          this.appointments[index].status = 'cancelled';
          this.appointments[index].estados_id = 3;
          console.log('📋 Status actualizado localmente');
        }

        this.updateStats();
        this.successMessage = `❌ Cita de ${appointment.clientName} cancelada`;
        if (reason && reason.trim()) {
          this.successMessage += ` - Motivo: ${reason}`;
        }
        this.isLoading = false;

        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (error: any) => {
        console.error('❌ Error al cancelar cita:', error);
        this.errorMessage = `Error al cancelar la cita de ${appointment.clientName}: ${error.message || 'Intente nuevamente'}`;
        this.isLoading = false;
      }
    });
  }

  // EDITAR CITA
  editAppointment(appointment: MappedAppointment): void {
    console.log('✏️ EDITANDO cita ID:', appointment.id, 'Cliente:', appointment.clientName);

    appointment.showMenu = false;
    this.selectedAppointment = appointment;
    this.isEditing = true;

    // Llenar el formulario con los datos existentes
    this.appointmentForm = {
      clientDocType: '',
      clientDocNumber: '',
      clientName: appointment.clientName || '',
      clientEmail: appointment.clientEmail || '',
      clientBirthDate: '',
      clientPhone: '',
      appointmentService: this.mapServiceNameToKey(appointment.serviceName) || 'manicure',
      appointmentStaff: 'pepita-perez',
      appointmentObservations: ''
    };

    // Seleccionar fecha y hora en el formulario
    this.formCalendarDays.forEach(day => day.selected = false);
    const dayToSelect = this.formCalendarDays.find(d => d.number === appointment.day);
    if (dayToSelect) {
      dayToSelect.selected = true;
      this.selectedDateText = `${appointment.day} de Mayo, 2025`;
    }

    this.timeSlots.forEach(slot => slot.selected = false);
    const timeToSelect = this.timeSlots.find(s => s.display === appointment.time);
    if (timeToSelect) {
      timeToSelect.selected = true;
    }

    // Actualizar servicio seleccionado
    this.onServiceChange();

    this.currentView = 'create';
    this.successMessage = `Formulario cargado para edición de ${appointment.clientName}. Modifique los datos y guarde.`;
    setTimeout(() => this.successMessage = '', 5000);
  }

  // ELIMINAR CITA
  deleteAppointment(appointment: MappedAppointment): void {
    console.log('🗑️ ELIMINANDO cita ID:', appointment.id, 'Cliente:', appointment.clientName);

    appointment.showMenu = false;

    const confirmDelete = confirm(
      `¿Está seguro de eliminar la cita de ${appointment.clientName}?\n\n` +
      `Fecha: ${appointment.day} ${appointment.monthName}\n` +
      `Hora: ${appointment.time}\n` +
      `Servicio: ${appointment.serviceName}\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) {
      console.log('Eliminación cancelada por el usuario');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentsService.delete(appointment.id).subscribe({
      next: (response: any) => {
        console.log('✅ Cita eliminada exitosamente:', response);

        // Eliminar de la lista local
        this.appointments = this.appointments.filter(apt => apt.id !== appointment.id);

        this.updateStats();
        this.updateCalendarWithAppointments();
        this.successMessage = `🗑️ Cita de ${appointment.clientName} eliminada exitosamente`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.error('❌ Error al eliminar cita:', error);
        this.errorMessage = `Error al eliminar la cita de ${appointment.clientName}: ${error.message || 'Intente nuevamente'}`;
        this.isLoading = false;
      }
    });
  }

  // CANCELAR EDICIÓN
  cancelEdit(): void {
    console.log('❌ Cancelando edición');
    this.isEditing = false;
    this.selectedAppointment = null;
    this.resetForm();
    this.switchView('list');
    this.successMessage = 'Edición cancelada';
    setTimeout(() => this.successMessage = '', 2000);
  }

  // ACTUALIZAR ESTADÍSTICAS
  updateStats(): void {
    this.stats = {
      reserved: this.appointments.filter(apt => apt.status === 'reserved').length,
      confirmed: this.appointments.filter(apt => apt.status === 'confirmed').length,
      cancelled: this.appointments.filter(apt => apt.status === 'cancelled').length
    };
    console.log('📊 Stats actualizados:', this.stats);
  }

  // ACTUALIZAR CALENDARIO CON CITAS
  updateCalendarWithAppointments(): void {
    const daysWithAppointments = this.appointments.map(apt => apt.day);

    this.calendarDays.forEach(day => {
      day.hasAppointments = daysWithAppointments.includes(day.number);
    });

    console.log('📅 Calendario actualizado con', daysWithAppointments.length, 'días con citas');
  }

  // RECARGAR DATOS
  reloadData(): void {
    console.log('🔄 Recargando datos manualmente...');
    this.errorMessage = '';
    this.successMessage = 'Recargando datos...';
    this.loadAppointments();
  }

  // VALIDAR FORMULARIO
  validateForm(): boolean {
    if (!this.appointmentForm.clientName.trim()) {
      this.errorMessage = 'El nombre del cliente es requerido';
      return false;
    }

    if (!this.appointmentForm.clientEmail.trim()) {
      this.errorMessage = 'El email del cliente es requerido';
      return false;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.appointmentForm.clientEmail.trim())) {
      this.errorMessage = 'El formato del email no es válido';
      return false;
    }

    if (!this.appointmentForm.appointmentService) {
      this.errorMessage = 'Debe seleccionar un servicio';
      return false;
    }

    return true;
  }

  // CAMBIAR VISTA
  switchView(view: 'list' | 'create'): void {
    console.log('🔄 Cambiando vista a:', view);
    this.currentView = view;
    this.errorMessage = '';
    this.successMessage = '';

    // Si cambias a create sin estar editando, resetea el formulario
    if (view === 'create' && !this.isEditing) {
      this.resetForm();
    }

    // Si cambias a list y estás editando, cancela la edición
    if (view === 'list' && this.isEditing) {
      this.cancelEdit();
    }
  }

  // GENERAR DÍAS DEL CALENDARIO
  generateCalendarDays(): void {
    const daysInMonth = 31; // Mayo 2025
    this.calendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push({
        number: i,
        selected: i === 15, // Día 15 seleccionado por defecto
        otherMonth: false
      });
    }
    console.log('📅 Calendario principal generado:', daysInMonth, 'días');
  }

  // GENERAR DÍAS DEL FORMULARIO
  generateFormCalendarDays(): void {
    const daysInMonth = 31; // Mayo 2025
    this.formCalendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      this.formCalendarDays.push({
        number: i,
        selected: false,
        otherMonth: false
      });
    }
    console.log('📅 Calendario del formulario generado:', daysInMonth, 'días');
  }

  // SELECCIONAR FECHA
  selectDate(day: CalendarDay): void {
    console.log('📅 Seleccionando fecha:', day.number);
    this.formCalendarDays.forEach(d => d.selected = false);
    day.selected = true;
    this.selectedDateText = `${day.number} de Mayo, 2025`;
    console.log('✅ Fecha seleccionada:', this.selectedDateText);
  }

  // SELECCIONAR HORA
  selectTime(slot: TimeSlot): void {
    console.log('🕐 Seleccionando hora:', slot.display);
    this.timeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    console.log('✅ Hora seleccionada:', slot.display);
  }

  // CAMBIO DE SERVICIO
  onServiceChange(): void {
    console.log('🔧 Cambio de servicio:', this.appointmentForm.appointmentService);
    if (this.appointmentForm.appointmentService) {
      this.selectedService = this.services[this.appointmentForm.appointmentService];
      console.log('✅ Información del servicio cargada:', this.selectedService);
    } else {
      this.selectedService = null;
    }
  }

  // CERRAR MENÚS AL HACER CLIC FUERA
  @HostListener('document:click', ['$event'])
  closeMenusOnOutsideClick(event: Event): void {
    this.appointments.forEach(apt => apt.showMenu = false);
  }

  // MÉTODOS PRIVADOS DE UTILIDAD

  private buildDateTime(day: number, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2025, 4, day, hours, minutes); // Mayo = mes 4 (0-indexed)
    return date.toISOString();
  }

  private buildEndDateTime(day: number, startTime: string, serviceKey: string): string {
    const durations: { [key: string]: number } = {
      manicure: 60,
      pedicure: 90,
      gelish: 120,
      acrilicas: 180,
      pestanas: 150
    };

    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMinutes = durations[serviceKey] || 60;
    const endDate = new Date(2025, 4, day, hours, minutes + durationMinutes);
    return endDate.toISOString();
  }

  private mapServiceNameToKey(serviceName: string | undefined): string {
    if (!serviceName) return '';

    const mapping: { [key: string]: string } = {
      'Manicure Clásico': 'manicure',
      'Pedicure Spa': 'pedicure',
      'Uñas en Gelish': 'gelish',
      'Uñas Acrílicas': 'acrilicas',
      'Pestañas': 'pestanas'
    };

    return mapping[serviceName] || 'manicure';
  }

  private getServiceId(serviceKey: string): number {
    const serviceIds: { [key: string]: number } = {
      manicure: 1,
      pedicure: 2,
      gelish: 3,
      acrilicas: 4,
      pestanas: 5
    };
    return serviceIds[serviceKey] || 1;
  }

  private getServiceDuration(serviceKey: string): number {
    const durations: { [key: string]: number } = {
      manicure: 60,
      pedicure: 90,
      gelish: 120,
      acrilicas: 180,
      pestanas: 150
    };
    return durations[serviceKey] || 60;
  }

  private resetForm(): void {
    console.log('🔄 Reseteando formulario');
    this.appointmentForm = {
      clientDocType: '',
      clientDocNumber: '',
      clientName: '',
      clientEmail: '',
      clientBirthDate: '',
      clientPhone: '',
      appointmentService: '',
      appointmentStaff: '',
      appointmentObservations: ''
    };

    this.formCalendarDays.forEach(day => day.selected = false);
    this.timeSlots.forEach(slot => slot.selected = false);
    this.selectedService = null;
    this.selectedDateText = '';
    this.isEditing = false;
    this.selectedAppointment = null;
  }

  private resetFormAndView(): void {
    console.log('🔄 Reseteando formulario y vista');
    this.resetForm();
    this.switchView('list');
  }
}
