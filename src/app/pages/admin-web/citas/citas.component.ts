import { Component, OnInit, Inject, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, Appointment } from '../../../services/appointments.service';

// Interfaz para los días del calendario
interface CalendarDay {
  date: Date;
  day: number;
  isOtherMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminWeb, ContenidoComponent],
  providers: [AppointmentsService]
})
export class CitasComponent implements OnInit {
  citas: Appointment[] = [];
  citaForm!: FormGroup;
  editingId: number | null = null;

  successMessage: string = '';
  errorMessage: string = '';
  selectedDateText: string = '';
  selectedDate: Date | null = null;

  // Estado para alinear con el template HTML actual
  currentView: 'list' | 'create' = 'list';
  isLoading: boolean = false;
  appointments: Appointment[] = [];
  stats = { reserved: 0, confirmed: 0, cancelled: 0 };
  calendarDays: CalendarDay[] = [];
  formCalendarDays: Array<{ number: number; selected?: boolean; otherMonth?: boolean }> = [];
  currentMonth: string = '';
  currentMonthYear: string = '';
  currentMonthDate: Date = new Date();
  currentMonthForm: string = '';
  appointmentForm: any = {
    clientDocType: '',
    clientDocNumber: '',
    clientName: '',
    clientEmail: '',
    clientBirthDate: '',
    clientPhone: '',
    appointmentService: '',
    appointmentStaff: '',
    appointmentObservations: '',
    time: ''
  };
  isEditing: boolean = false;
  selectedService: { price: number; duration: string; recommendation: string } | null = null;
  selectedAppointmentInfo: { price: number; duration: string; recommendation: string } = {
    price: 0,
    duration: '',
    recommendation: ''
  };

  // Tipos de citas disponibles
  appointmentTypes = [
    { value: 'manicure', label: 'Manicure', price: 25000, duration: '45 min', recommendation: 'Trae las uñas limpias' },
    { value: 'pedicure', label: 'Pedicure', price: 30000, duration: '60 min', recommendation: 'Usa sandalias' },
    { value: 'depilacion', label: 'Depilación', price: 35000, duration: '30 min', recommendation: 'No uses cremas' },
    { value: 'masaje', label: 'Masaje', price: 50000, duration: '90 min', recommendation: 'Ven relajado' }
  ];

  timeSlots: Array<{ time: string; display: string; selected?: boolean }> = [
    { time: '09:00', display: '9:00 am' },
    { time: '09:30', display: '9:30 am' },
    { time: '10:00', display: '10:00 am' },
    { time: '10:30', display: '10:30 am' },
    { time: '11:00', display: '11:00 am' },
    { time: '11:30', display: '11:30 am' },
    { time: '14:00', display: '2:00 pm' },
    { time: '14:30', display: '2:30 pm' },
    { time: '15:00', display: '3:00 pm' },
    { time: '15:30', display: '3:30 pm' },
    { time: '16:00', display: '4:00 pm' },
    { time: '16:30', display: '4:30 pm' },
    { time: '17:00', display: '5:00 pm' },
    { time: '17:30', display: '5:30 pm' }
  ];

  private appointmentsService!: AppointmentsService;

  constructor(
    private fb: FormBuilder,
    private injector: Injector
  ) {
    this.appointmentsService = this.injector.get(AppointmentsService);
    this.initForm();
  }

  ngOnInit(): void {
    this.updateMonthTitle();
    this.buildCalendar();
    this.initFormCalendar();
    this.cargarCitas();
  }

  private initForm(): void {
    this.citaForm = this.fb.group({
      clientName: ['', Validators.required],
      serviceName: ['', Validators.required],
      day: [new Date().getDate(), Validators.required],
      monthName: ['ENERO', Validators.required],
      time: ['09:00', Validators.required],
      status: ['reserved'],
      nota: ['']
    });
  }

  get form() {
    return this.citaForm;
  }

  /* ---------- Cargar citas desde el servicio ---------- */
  cargarCitas(): void {
    this.appointmentsService.getAll().subscribe({
      next: (data: Appointment[]) => {
        this.citas = data;
        this.appointments = data;
        this.computeStats(data);
      },
      error: (err: unknown) => {
        const anyErr = err as { message?: string };
        this.errorMessage = `Error al cargar citas: ${anyErr?.message || 'Intente nuevamente.'}`;
        console.error('Error al cargar citas:', err);
      }
    });
  }

  /* ---------- Eliminar cita ---------- */
  eliminarCita(id: number, clientName: string): void {
    if (!confirm(`¿Está seguro de eliminar la cita de ${clientName}?`)) return;

    this.appointmentsService.delete(id).subscribe({
      next: () => {
        this.successMessage = `✔ Cita de ${clientName} eliminada correctamente`;
        this.errorMessage = '';
        this.cargarCitas();
      },
      error: (err: unknown) => {
        const anyErr = err as { message?: string };
        this.errorMessage = `Error al eliminar cita: ${anyErr?.message || 'Intente nuevamente.'}`;
      }
    });
  }

  /* ---------- Cambiar estado de cita ---------- */
  cambiarEstado(id: number, clientName: string, nuevoEstado: string): void {
    this.appointmentsService.changeStatus(id, nuevoEstado).subscribe({
      next: () => {
        this.successMessage = `🔄 Estado de la cita de ${clientName} cambiado a "${nuevoEstado}"`;
        this.errorMessage = '';
        this.cargarCitas();
      },
      error: (err: unknown) => {
        const anyErr = err as { message?: string };
        this.errorMessage = `Error al cambiar estado: ${anyErr?.message || 'Intente nuevamente.'}`;
      }
    });
  }

  /* ---------- Appointment type/service change ---------- */
  onAppointmentTypeChange() {
    const val = this.citaForm.get('serviceName')?.value || this.appointmentForm.appointmentService;
    const found = this.appointmentTypes.find(t => t.value === val);
    if (found) {
      this.selectedAppointmentInfo = {
        price: found.price,
        duration: found.duration,
        recommendation: found.recommendation
      };
      this.selectedService = this.selectedAppointmentInfo;
    } else {
      this.selectedAppointmentInfo = { price: 0, duration: '', recommendation: '' };
      this.selectedService = null;
    }
  }

  onServiceChange() {
    this.onAppointmentTypeChange();
  }

  /* ---------- Calendar helpers ---------- */
  updateMonthTitle() {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    this.currentMonthYear = this.currentMonthDate.toLocaleDateString('es-ES', options);
    this.currentMonth = this.currentMonthYear;
  }

  buildCalendar() {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const weekdayIndex = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - weekdayIndex);

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const isOtherMonth = d.getMonth() !== month;
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      const isSelected = this.selectedDate
        ? d.getFullYear() === this.selectedDate.getFullYear() &&
          d.getMonth() === this.selectedDate.getMonth() &&
          d.getDate() === this.selectedDate.getDate()
        : false;

      days.push({
        date: d,
        day: d.getDate(),
        isOtherMonth,
        isToday,
        isSelected
      });
    }
    this.calendarDays = days;
  }

  previousMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() - 1,
      1
    );
    this.updateMonthTitle();
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() + 1,
      1
    );
    this.updateMonthTitle();
    this.buildCalendar();
  }

  /* ---------- View management ---------- */
  switchView(view: 'list' | 'create'): void {
    this.currentView = view;
    this.successMessage = '';
    this.errorMessage = '';
    if (view === 'create' && !this.isEditing) {
      this.resetForm();
    }
  }

  reloadData(): void {
    this.cargarCitas();
  }

  /* ---------- Track functions for *ngFor ---------- */
  trackDay(_: number, item: CalendarDay | { number: number }): string | number {
    if ('date' in item) {
      return `${item.date.getTime()}`;
    }
    return item.number;
  }

  trackAppointment(_: number, item: Appointment): number {
    return item.id ?? 0;
  }

  trackSlot(_: number, item: { time: string }): string {
    return item.time;
  }

  /* ---------- Date and time selection ---------- */
  selectDate(day: { number: number }): void {
    this.formCalendarDays.forEach(d => d.selected = false);
    const found = this.formCalendarDays.find(d => d.number === day.number);
    if (found) {
      found.selected = true;
      this.selectedDateText = `Día ${day.number}`;
    }
  }

  selectTime(slot: { time: string; display: string; selected?: boolean }): void {
    this.timeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    this.appointmentForm.time = slot.time;
  }

  /* ---------- Menu and actions ---------- */
  toggleMenu(event: Event, appointment: any): void {
    event.stopPropagation();
    appointment.showMenu = !appointment.showMenu;
  }

  confirmAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.cambiarEstado(appointment.id, appointment.clientName, 'confirmed');
  }

  cancelAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.cambiarEstado(appointment.id, appointment.clientName, 'cancelled');
  }

  editAppointment(appointment: Appointment): void {
    this.isEditing = true;
    this.editingId = appointment.id ?? null;

    // Sincroniza formulario reactivo
    this.citaForm.patchValue({
      clientName: appointment.clientName,
      serviceName: appointment.serviceName,
      day: appointment.day,
      monthName: appointment.monthName,
      time: appointment.time,
      status: appointment.status,
      nota: appointment.nota || ''
    });

    // Sincroniza formulario ngModel
    this.appointmentForm = {
      clientDocType: appointment.tipo_documento || '',
      clientDocNumber: appointment.numero_documento || '',
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail || '',
      clientBirthDate: appointment.fecha_nacimiento || '',
      clientPhone: appointment.numero_telefono || '',
      appointmentService: appointment.serviceName,
      appointmentStaff: appointment.staffName || '',
      appointmentObservations: appointment.nota || '',
      time: appointment.time
    };

    // Seleccionar hora
    this.timeSlots.forEach(s => s.selected = (s.time === appointment.time));

    // Seleccionar día
    if (typeof appointment.day === 'number') {
      this.formCalendarDays.forEach(d => d.selected = d.number === appointment.day);
      this.selectedDateText = `Día ${appointment.day}`;
    }

    // Actualizar info del servicio
    this.onServiceChange();

    this.switchView('create');
  }

  deleteAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.eliminarCita(appointment.id, appointment.clientName);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingId = null;
    this.resetForm();
    this.switchView('list');
  }

  resetForm(): void {
    this.citaForm.reset({
      clientName: '',
      serviceName: '',
      day: new Date().getDate(),
      monthName: 'ENERO',
      time: '09:00',
      status: 'reserved',
      nota: ''
    });

    this.appointmentForm = {
      clientDocType: '',
      clientDocNumber: '',
      clientName: '',
      clientEmail: '',
      clientBirthDate: '',
      clientPhone: '',
      appointmentService: '',
      appointmentStaff: '',
      appointmentObservations: '',
      time: ''
    };

    this.timeSlots.forEach(s => s.selected = false);
    this.formCalendarDays.forEach(d => d.selected = false);
    this.selectedService = null;
    this.selectedDateText = '';
  }

  /* ---------- Form submission ---------- */
  onSubmit(): void {
    const selectedDay = this.formCalendarDays.find(d => d.selected)?.number;
    const selectedTime = this.timeSlots.find(t => t.selected)?.time || this.appointmentForm.time;
    const monthName = this.currentMonthForm?.split(' ')[0] || this.currentMonth || 'ENERO';

    const payload: Appointment = {
      id: this.isEditing ? this.editingId ?? undefined : undefined,
      clientName: this.appointmentForm.clientName || this.citaForm.value.clientName || 'Cliente',
      serviceName: this.appointmentForm.appointmentService || this.citaForm.value.serviceName || 'manicure',
      day: selectedDay || this.citaForm.value.day || new Date().getDate(),
      monthName: monthName || this.citaForm.value.monthName || 'ENERO',
      time: selectedTime || this.citaForm.value.time || '09:00',
      status: this.isEditing ? (this.citaForm.value.status || 'reserved') : 'reserved',
      nota: this.appointmentForm.appointmentObservations || this.citaForm.value.nota || '',
      clientEmail: this.appointmentForm.clientEmail || '',
      staffName: this.appointmentForm.appointmentStaff || '',
      tipo_documento: this.appointmentForm.clientDocType || 'CC',
      numero_documento: this.appointmentForm.clientDocNumber || '',
      fecha_nacimiento: this.appointmentForm.clientBirthDate || '',
      numero_telefono: this.appointmentForm.clientPhone || ''
    };

    this.isLoading = true;

    if (this.isEditing && this.editingId) {
      this.appointmentsService.update(this.editingId, payload).subscribe({
        next: () => {
          this.successMessage = '✔ Cambios guardados exitosamente';
          this.errorMessage = '';
          this.isEditing = false;
          this.editingId = null;
          this.isLoading = false;
          this.resetForm();
          this.switchView('list');
          this.cargarCitas();
        },
        error: (err: unknown) => {
          const anyErr = err as { message?: string };
          this.errorMessage = `Error al guardar cambios: ${anyErr?.message || 'Intente nuevamente.'}`;
          this.isLoading = false;
        }
      });
    } else {
      this.appointmentsService.create(payload).subscribe({
        next: () => {
          this.successMessage = '✔ Cita creada exitosamente';
          this.errorMessage = '';
          this.isLoading = false;
          this.resetForm();
          this.switchView('list');
          this.cargarCitas();
        },
        error: (err: unknown) => {
          const anyErr = err as { message?: string };
          this.errorMessage = `Error al crear cita: ${anyErr?.message || 'Intente nuevamente.'}`;
          this.isLoading = false;
        }
      });
    }
  }

  /* ---------- Private helpers ---------- */
  private initFormCalendar(): void {
    const now = new Date();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    this.formCalendarDays = Array.from({ length: lastDay }, (_, i) => ({
      number: i + 1,
      selected: false
    }));
    this.currentMonthForm = `${months[monthIndex]} ${year}`;
  }

  private computeStats(list: Appointment[]): void {
    const reserved = list.filter(a => a.status === 'reserved').length;
    const confirmed = list.filter(a => a.status === 'confirmed').length;
    const cancelled = list.filter(a => a.status === 'cancelled').length;
    this.stats = { reserved, confirmed, cancelled };
  }
}
