import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService } from '../../../services/appointments.service';
import { AdminWeb } from "../admin-web";

// Interfaces locales para el componente
export interface CreateAppointmentData {
  usuarios_id: number;
  negocios_id: number;
  servicios_id: number;
  fecha: string;
  fecha_fin: string;
  estados_id: number;
  nota?: string;
  tiempo_estimado?: number;
}

export interface MappedAppointment {
  id: number;
  fecha: string;
  fecha_fin: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  day: number;
  monthName: string;
  time: string;
  status: 'reserved' | 'confirmed' | 'cancelled';
  usuarios_id: number;
  negocios_id: number;
  servicios_id: number;
  estados_id: number;
  showMenu?: boolean;
}

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
    { time: '9:00', display: '9:00 am', selected: false },
    { time: '9:30', display: '9:30 am', selected: false },
    { time: '10:30', display: '10:30 am', selected: false },
    { time: '11:00', display: '11:00 am', selected: false },
    { time: '14:30', display: '2:30 pm', selected: false },
    { time: '15:00', display: '3:00 pm', selected: false },
    { time: '15:30', display: '3:30 pm', selected: false },
    { time: '17:30', display: '5:30 pm', selected: false }
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
    console.log('CitasComponent iniciado - CRUD completo');
    this.generateCalendarDays();
    this.generateFormCalendarDays();
    this.loadAppointments();
  }

  // CARGAR CITAS DESDE EL API
  loadAppointments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Cargando citas desde el servicio...');

    this.appointmentsService.getAll().subscribe({
      next: (appointments: any) => {
        console.log('Citas cargadas exitosamente:', appointments);
        // Mapear los datos si es necesario
        this.appointments = this.mapAppointments(appointments);
        this.updateStats();
        this.updateCalendarWithAppointments();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.errorMessage = 'Error al cargar las citas. Verifique la conexión.';
        this.isLoading = false;
        this.loadTestData();
      }
    });
  }

  // DATOS DE PRUEBA
  loadTestData(): void {
    console.log('Cargando datos de prueba...');
    this.appointments = [
      {
        id: 999,
        fecha: '2025-05-15T10:00:00',
        fecha_fin: '2025-05-15T11:00:00',
        clientName: 'María García (PRUEBA)',
        clientEmail: 'maria@test.com',
        serviceName: 'Manicure Clásico',
        staffName: 'Pepita Perez',
        day: 15,
        monthName: 'MAY',
        time: '10:00 am',
        status: 'confirmed',
        usuarios_id: 1,
        negocios_id: 1,
        servicios_id: 1,
        estados_id: 2
      },
      {
        id: 998,
        fecha: '2025-05-16T14:30:00',
        fecha_fin: '2025-05-16T16:00:00',
        clientName: 'Juan Pérez (PRUEBA)',
        clientEmail: 'juan@test.com',
        serviceName: 'Pedicure Spa',
        staffName: 'Luna Lunera',
        day: 16,
        monthName: 'MAY',
        time: '2:30 pm',
        status: 'reserved',
        usuarios_id: 1,
        negocios_id: 1,
        servicios_id: 2,
        estados_id: 1
      }
    ];
    this.updateStats();
  }

  // MAPEAR DATOS DE CITAS
  mapAppointments(rawData: any): MappedAppointment[] {
    if (!Array.isArray(rawData)) return [];

    return rawData.map((item: any) => ({
      id: item.id || 0,
      fecha: item.fecha || '',
      fecha_fin: item.fecha_fin || '',
      clientName: item.clientName || item.client_name || 'Cliente',
      clientEmail: item.clientEmail || item.client_email || '',
      serviceName: item.serviceName || item.service_name || 'Servicio',
      staffName: item.staffName || item.staff_name || 'Personal',
      day: item.day || new Date(item.fecha).getDate(),
      monthName: item.monthName || 'MAY',
      time: item.time || new Date(item.fecha).toLocaleTimeString(),
      status: this.mapStatus(item.estados_id || item.status),
      usuarios_id: item.usuarios_id || 1,
      negocios_id: item.negocios_id || 1,
      servicios_id: item.servicios_id || 1,
      estados_id: item.estados_id || 1,
      showMenu: false
    }));
  }

  // MAPEAR UNA SOLA CITA
  mapSingleAppointment(item: any): MappedAppointment {
    return {
      id: item.id || 0,
      fecha: item.fecha || '',
      fecha_fin: item.fecha_fin || '',
      clientName: item.clientName || item.client_name || 'Cliente',
      clientEmail: item.clientEmail || item.client_email || '',
      serviceName: item.serviceName || item.service_name || 'Servicio',
      staffName: item.staffName || item.staff_name || 'Personal',
      day: item.day || new Date(item.fecha).getDate(),
      monthName: item.monthName || 'MAY',
      time: item.time || new Date(item.fecha).toLocaleTimeString(),
      status: this.mapStatus(item.estados_id || item.status),
      usuarios_id: item.usuarios_id || 1,
      negocios_id: item.negocios_id || 1,
      servicios_id: item.servicios_id || 1,
      estados_id: item.estados_id || 1,
      showMenu: false
    };
  }

  // MAPEAR ESTADO
  mapStatus(estadoId: number | string): 'reserved' | 'confirmed' | 'cancelled' {
    if (typeof estadoId === 'string') {
      return estadoId as 'reserved' | 'confirmed' | 'cancelled';
    }

    switch (estadoId) {
      case 1: return 'reserved';
      case 2: return 'confirmed';
      case 3: return 'cancelled';
      default: return 'reserved';
    }
  }
  getAppointmentById(id: number | string): void {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (isNaN(numericId)) {
      console.error('ID inválido:', id);
      return;
    }

    this.appointmentsService.getById(numericId).subscribe({
      next: (appointment: any) => {
        console.log('Cita obtenida por ID:', appointment);
        this.selectedAppointment = this.mapSingleAppointment(appointment);
      },
      error: (error: any) => {
        console.error('Error al obtener cita por ID:', error);
        this.errorMessage = 'Error al cargar la cita seleccionada.';
      }
    });
  }

  // CREAR/EDITAR CITA
  onSubmit(): void {
    console.log('BOTÓN SUBMIT CLICKEADO');
    console.log('Datos del formulario:', this.appointmentForm);
    console.log('Modo edición:', this.isEditing);
    console.log('Cita seleccionada:', this.selectedAppointment);

    const selectedDate = this.formCalendarDays.find(day => day.selected);
    const selectedTime = this.timeSlots.find(slot => slot.selected);

    console.log('Fecha seleccionada:', selectedDate);
    console.log('Hora seleccionada:', selectedTime);

    if (!selectedDate || !selectedTime) {
      console.log('FALTA FECHA U HORA');
      this.errorMessage = 'Debe seleccionar fecha y hora';
      return;
    }

    if (!this.validateForm()) {
      console.log('VALIDACIÓN FALLÓ');
      return;
    }

    const appointmentData: CreateAppointmentData = {
      usuarios_id: 1,
      negocios_id: 1,
      servicios_id: this.getServiceId(this.appointmentForm.appointmentService),
      fecha: this.buildDateTime(selectedDate.number, selectedTime.time),
      fecha_fin: this.buildEndDateTime(selectedDate.number, selectedTime.time, this.appointmentForm.appointmentService),
      estados_id: 1,
      nota: this.appointmentForm.appointmentObservations,
      tiempo_estimado: this.getServiceDuration(this.appointmentForm.appointmentService)
    };

    console.log('Datos a enviar:', appointmentData);
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditing && this.selectedAppointment) {
      // MODO EDICIÓN
      this.appointmentsService.update(this.selectedAppointment.id, appointmentData).subscribe({
        next: (updatedAppointment: any) => {
          console.log('Cita actualizada exitosamente:', updatedAppointment);
          this.successMessage = 'Cita actualizada exitosamente';
          this.loadAppointments();
          this.resetForm();
          this.switchView('list');
          this.isLoading = false;
          this.isEditing = false;
          this.selectedAppointment = null;
        },
        error: (error: any) => {
          console.error('Error al actualizar cita:', error);
          this.errorMessage = 'Error al actualizar la cita: ' + (error.error?.message || error.message);
          this.isLoading = false;
        }
      });
    } else {
      // MODO CREACIÓN
      this.appointmentsService.create(appointmentData).subscribe({
        next: (newAppointment: any) => {
          console.log('Cita creada exitosamente:', newAppointment);
          this.successMessage = 'Cita creada exitosamente';
          this.loadAppointments();
          this.resetForm();
          this.switchView('list');
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al crear cita:', error);
          this.errorMessage = 'Error al crear la cita. Verifique los datos.';
          this.isLoading = false;
        }
      });
    }
  }

  // TOGGLE MENU
  toggleMenu(event: Event, appointment: MappedAppointment): void {
    console.log('Toggle menu para cita:', appointment.id);
    event.stopPropagation();

    this.appointments.forEach(apt => {
      if (apt.id !== appointment.id) {
        apt.showMenu = false;
      }
    });

    appointment.showMenu = !appointment.showMenu;
    console.log('Menú estado:', appointment.showMenu);
  }

  // CONFIRMAR CITA
  confirmAppointment(appointment: MappedAppointment): void {
    console.log('CONFIRMANDO cita ID:', appointment.id);

    appointment.showMenu = false;

    if (appointment.status === 'confirmed') {
      console.log('La cita ya está confirmada');
      this.errorMessage = 'La cita ya está confirmada';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Crear datos para actualizar solo el estado
    const updateData: CreateAppointmentData = {
      usuarios_id: appointment.usuarios_id,
      negocios_id: appointment.negocios_id,
      servicios_id: appointment.servicios_id,
      fecha: appointment.fecha,
      fecha_fin: appointment.fecha_fin,
      estados_id: 2, // Estado confirmado
      nota: '',
      tiempo_estimado: 60
    };

    this.appointmentsService.update(appointment.id, updateData).subscribe({
      next: (updatedAppointment: any) => {
        console.log('Cita confirmada exitosamente:', updatedAppointment);

        const index = this.appointments.findIndex(apt => apt.id === appointment.id);
        if (index !== -1) {
          this.appointments[index].status = 'confirmed';
          this.appointments[index].estados_id = 2;
          console.log('Status actualizado en la lista local');
        }

        this.updateStats();
        this.successMessage = `Cita de ${appointment.clientName} confirmada exitosamente`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.error('Error al confirmar cita:', error);
        this.errorMessage = 'Error al confirmar la cita. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // CANCELAR CITA
  cancelAppointment(appointment: MappedAppointment): void {
    console.log('CANCELANDO cita ID:', appointment.id);

    appointment.showMenu = false;

    if (appointment.status === 'cancelled') {
      console.log('La cita ya está cancelada');
      this.errorMessage = 'La cita ya está cancelada';
      return;
    }

    const reason = prompt('¿Cuál es el motivo de la cancelación? (opcional)');

    if (reason === null) {
      console.log('Cancelación abortada por el usuario');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Crear datos para actualizar solo el estado
    const updateData: CreateAppointmentData = {
      usuarios_id: appointment.usuarios_id,
      negocios_id: appointment.negocios_id,
      servicios_id: appointment.servicios_id,
      fecha: appointment.fecha,
      fecha_fin: appointment.fecha_fin,
      estados_id: 3, // Estado cancelado
      nota: reason || '',
      tiempo_estimado: 60
    };

    this.appointmentsService.update(appointment.id, updateData).subscribe({
      next: (updatedAppointment: any) => {
        console.log('Cita cancelada exitosamente:', updatedAppointment);

        const index = this.appointments.findIndex(apt => apt.id === appointment.id);
        if (index !== -1) {
          this.appointments[index].status = 'cancelled';
          this.appointments[index].estados_id = 3;
          console.log('Status actualizado en la lista local');
        }

        this.updateStats();
        this.successMessage = `Cita de ${appointment.clientName} cancelada`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.error('Error al cancelar cita:', error);
        this.errorMessage = 'Error al cancelar la cita. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // EDITAR CITA
  editAppointment(appointment: MappedAppointment): void {
    console.log('EDITANDO cita ID:', appointment.id);

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

    this.currentView = 'create';
    this.successMessage = 'Formulario cargado para edición. Modifique los datos y guarde.';
    setTimeout(() => this.successMessage = '', 5000);
  }

  // ELIMINAR CITA
  deleteAppointment(appointment: MappedAppointment): void {
    console.log('ELIMINANDO cita ID:', appointment.id);

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
        console.log('Cita eliminada exitosamente:', response);

        this.appointments = this.appointments.filter(apt => apt.id !== appointment.id);

        this.updateStats();
        this.updateCalendarWithAppointments();
        this.successMessage = `Cita de ${appointment.clientName} eliminada exitosamente`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.error('Error al eliminar cita:', error);
        this.errorMessage = 'Error al eliminar la cita. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // CANCELAR EDICIÓN
  cancelEdit(): void {
    this.isEditing = false;
    this.selectedAppointment = null;
    this.resetForm();
    this.switchView('list');
  }

  // ACTUALIZAR ESTADÍSTICAS
  updateStats(): void {
    this.stats = {
      reserved: this.appointments.filter(apt => apt.status === 'reserved').length,
      confirmed: this.appointments.filter(apt => apt.status === 'confirmed').length,
      cancelled: this.appointments.filter(apt => apt.status === 'cancelled').length
    };
    console.log('Stats actualizados:', this.stats);
  }

  // ACTUALIZAR CALENDARIO CON CITAS
  updateCalendarWithAppointments(): void {
    const daysWithAppointments = this.appointments.map(apt => apt.day);

    this.calendarDays.forEach(day => {
      day.hasAppointments = daysWithAppointments.includes(day.number);
    });
  }

  // RECARGAR DATOS
  reloadData(): void {
    console.log('Recargando datos manualmente...');
    this.errorMessage = '';
    this.successMessage = '';
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

    if (!this.appointmentForm.appointmentService) {
      this.errorMessage = 'Debe seleccionar un servicio';
      return false;
    }

    return true;
  }

  // Cerrar menús al hacer clic fuera
  @HostListener('document:click', ['$event'])
  closeMenusOnOutsideClick(event: Event): void {
    this.appointments.forEach(apt => apt.showMenu = false);
  }

  // MÉTODOS AUXILIARES

  switchView(view: 'list' | 'create'): void {
    this.currentView = view;
    this.errorMessage = '';
    this.successMessage = '';

    // Si cambias a create sin estar editando, resetea el formulario
    if (view === 'create' && !this.isEditing) {
      this.resetForm();
    }
  }

  generateCalendarDays(): void {
    const daysInMonth = 31;
    this.calendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push({
        number: i,
        selected: i === 15,
        otherMonth: false
      });
    }
  }

  generateFormCalendarDays(): void {
    const daysInMonth = 31;
    this.formCalendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      this.formCalendarDays.push({
        number: i,
        selected: false,
        otherMonth: false
      });
    }
  }

  selectDate(day: CalendarDay): void {
    this.formCalendarDays.forEach(d => d.selected = false);
    day.selected = true;
    this.selectedDateText = `${day.number} de Mayo, 2025`;
  }

  selectTime(slot: TimeSlot): void {
    this.timeSlots.forEach(s => s.selected = false);
    slot.selected = true;
  }

  onServiceChange(): void {
    if (this.appointmentForm.appointmentService) {
      this.selectedService = this.services[this.appointmentForm.appointmentService];
    } else {
      this.selectedService = null;
    }
  }

  // MÉTODOS PRIVADOS DE UTILIDAD

  private buildDateTime(day: number, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2025, 4, day, hours, minutes); // Mayo = mes 4 (0-indexed)
    return date.toISOString();
  }

  private buildEndDateTime(day: number, startTime: string, serviceKey: string): string {
    const durations: { [key: string]: number } = {
      manicure: 60, pedicure: 90, gelish: 120, acrilicas: 180, pestanas: 150
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
      manicure: 1, pedicure: 2, gelish: 3, acrilicas: 4, pestanas: 5
    };
    return serviceIds[serviceKey] || 1;
  }

  private getServiceDuration(serviceKey: string): number {
    const durations: { [key: string]: number } = {
      manicure: 60, pedicure: 90, gelish: 120, acrilicas: 180, pestanas: 150
    };
    return durations[serviceKey] || 60;
  }

  private calculateEndDate(startTime: string, serviceKey: string): string {
    const selectedDate = this.formCalendarDays.find(day => day.selected);
    if (!selectedDate) return '';

    const durationMinutes = this.getServiceDuration(serviceKey);
    const baseDate = `2025-05-${selectedDate.number.toString().padStart(2, '0')}`;

    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;

    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;

    return `${baseDate}T${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
  }

  private resetForm(): void {
    this.appointmentForm = {
      clientDocType: '', clientDocNumber: '', clientName: '', clientEmail: '',
      clientBirthDate: '', clientPhone: '', appointmentService: '',
      appointmentStaff: '', appointmentObservations: ''
    };

    this.formCalendarDays.forEach(day => day.selected = false);
    this.timeSlots.forEach(slot => slot.selected = false);
    this.selectedService = null;
    this.selectedDateText = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditing = false;
    this.selectedAppointment = null;
  }
}
