import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, Appointment } from '../../../services/appointments.service';
import { ScheduleService, Staff } from '../../../services/schedule.service';

interface CalendarDay {
  number: number;
  date: Date;
  selected?: boolean;
  otherMonth?: boolean;
  disabled?: boolean;
  isToday?: boolean;
}

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, AdminWeb, ContenidoComponent]
})
export class CitasComponent implements OnInit {
  
  // 🔥 ESTADO
  currentView: 'list' | 'create' = 'list';
  isLoading = false;
  isEditing = false;
  editingId: number | null = null;
  
  // 🔥 MENSAJES
  successMessage = '';
  errorMessage = '';
  
  // 🔥 DATOS
  appointments: Appointment[] = [];
  stats = { reserved: 0, confirmed: 0, cancelled: 0 };
  
  // 🔥 FORMULARIO - OBJETO SIMPLE
  form = {
    clientDocType: '',
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
  
  // 🔥 CALENDARIO Y HORARIOS
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
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Componente de citas inicializado');
    this.staffList = this.scheduleService.getStaffList();
    this.availableTimeSlots = [...this.allTimeSlots];
    this.initCalendars();
    this.loadAppointments();
  }

  // ============================================
  // 🔥 CRUD BÁSICO
  // ============================================
  
  loadAppointments(): void {
    console.log('📋 Cargando citas...');
    this.isLoading = true;
    
    this.appointmentsService.getAll().subscribe({
      next: (data) => {
        console.log(`✅ ${data.length} citas cargadas`);
        this.appointments = data;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.errorMessage = err.message || 'Error al cargar citas';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    console.log('📤 Intentando enviar formulario...');
    
    // 🔥 VALIDACIÓN
    if (!this.form.clientName?.trim()) {
      this.showError('El nombre es obligatorio');
      return;
    }
    if (!this.form.clientEmail?.trim()) {
      this.showError('El email es obligatorio');
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
      this.showError('Seleccione una fecha en el calendario');
      return;
    }
    if (!this.form.selectedTime) {
      this.showError('Seleccione una hora');
      return;
    }

    // 🔥 CONSTRUIR APPOINTMENT
    const appointment: Appointment = {
      clientName: this.form.clientName.trim(),
      clientEmail: this.form.clientEmail.trim(),
      clientDocType: this.form.clientDocType || 'CC',
      clientDocNumber: this.form.clientDocNumber || '0000000000',
      clientBirthDate: this.form.clientBirthDate || '2000-01-01',
      clientPhone: this.form.clientPhone || '3000000000',
      serviceName: this.form.appointmentService,
      staffName: this.getStaffName(this.form.appointmentStaff),
      day: this.form.selectedDay,
      monthName: this.form.selectedMonth,
      time: this.form.selectedTime,
      status: 'reserved',
      nota: this.form.appointmentObservations || ''
    };

    console.log('📦 Appointment a enviar:', appointment);
    this.isLoading = true;

    if (this.isEditing && this.editingId) {
      // ACTUALIZAR
      appointment.id = this.editingId;
      this.appointmentsService.update(this.editingId, appointment).subscribe({
        next: () => {
          this.showSuccess('✅ Cita actualizada exitosamente');
          this.resetAndGoToList();
        },
        error: (err) => {
          this.showError(`Error al actualizar: ${err.message}`);
          this.isLoading = false;
        }
      });
    } else {
      // CREAR
      this.appointmentsService.create(appointment).subscribe({
        next: () => {
          this.showSuccess('✅ Cita creada exitosamente');
          this.resetAndGoToList();
        },
        error: (err) => {
          this.showError(`Error al crear: ${err.message}`);
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
      clientDocType: apt.clientDocType || '',
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
    
    // Marcar en calendario y horario
    this.formCalendarDays.forEach(d => d.selected = d.number === apt.day);
    this.availableTimeSlots.forEach(s => s.selected = s.time === apt.time);
    this.selectedDateText = `Día ${apt.day}`;
    
    if (apt.staffName) {
      this.onStaffChange();
    }
    
    this.switchView('create');
  }

  deleteAppointment(apt: Appointment): void {
    if (!apt.id) return;
    apt.showMenu = false;
    
    if (!confirm(`¿Eliminar cita de ${apt.clientName}?`)) return;
    
    this.isLoading = true;
    this.appointmentsService.delete(apt.id).subscribe({
      next: () => {
        this.showSuccess(`✅ Cita de ${apt.clientName} eliminada`);
        this.loadAppointments();
      },
      error: (err) => {
        this.showError(`Error al eliminar: ${err.message}`);
        this.isLoading = false;
      }
    });
  }

  confirmAppointment(apt: Appointment): void {
    if (!apt.id) return;
    apt.showMenu = false;
    this.changeStatus(apt.id, 'confirmed', apt);
  }

  cancelAppointment(apt: Appointment): void {
    if (!apt.id) return;
    apt.showMenu = false;
    this.changeStatus(apt.id, 'cancelled', apt);
  }

  private changeStatus(id: number, status: string, apt: Appointment): void {
    this.isLoading = true;
    this.appointmentsService.changeStatus(id, status, apt).subscribe({
      next: () => {
        this.showSuccess(`✅ Estado cambiado a ${status}`);
        this.loadAppointments();
      },
      error: (err) => {
        this.showError(`Error: ${err.message}`);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // 🔥 CALENDARIO
  // ============================================
  
  private initCalendars(): void {
    this.buildListCalendar();
    this.buildFormCalendar();
  }

  private buildListCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    
    this.currentMonthYear = `${months[month]} ${year}`;
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const offset = (firstDayIndex + 6) % 7;
    const today = new Date();
    
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < offset; i++) {
      days.push({ number: 0, date: new Date(year, month, -offset + i + 1), otherMonth: true });
    }
    
    for (let d = 1; d <= lastDay; d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        number: d,
        date: dateObj,
        isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
      });
    }
    
    this.calendarDays = days;
  }

  private buildFormCalendar(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    
    this.currentMonthForm = `${months[month]} ${year}`;
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const offset = (firstDayIndex + 6) % 7;
    
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < offset; i++) {
      days.push({ number: 0, date: new Date(year, month, -offset + i + 1), otherMonth: true });
    }
    
    for (let d = 1; d <= lastDay; d++) {
      days.push({ number: d, date: new Date(year, month, d) });
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
    
    console.log(`📅 Fecha seleccionada: ${day.number} de ${this.form.selectedMonth}`);
    
    if (this.form.appointmentStaff) {
      this.updateTimeSlotsForDay(day.number);
    }
  }

  selectTime(slot: { time: string; display: string; selected?: boolean }): void {
    this.availableTimeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    this.form.selectedTime = slot.time;
    console.log(`⏰ Hora seleccionada: ${slot.time}`);
  }

  // ============================================
  // 🔥 HORARIOS Y PERSONAL
  // ============================================
  
  onStaffChange(): void {
    const staffId = this.form.appointmentStaff;
    console.log('👤 Personal seleccionado:', staffId);
    
    if (!staffId) {
      this.availableTimeSlots = [...this.allTimeSlots];
      this.workingDays = [];
      this.formCalendarDays.forEach(d => d.disabled = false);
      return;
    }
    
    this.scheduleService.getWorkingDays(staffId).subscribe({
      next: (days) => {
        this.workingDays = days;
        console.log('📅 Días laborables:', days);
        this.markDisabledDays(days);
        
        if (this.form.selectedDay) {
          this.updateTimeSlotsForDay(this.form.selectedDay);
        }
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.workingDays = [];
      }
    });
  }

  private markDisabledDays(workingDays: string[]): void {
    const daysMap: { [key: string]: number } = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sabado': 6
    };
    
    const workingDayIndices = workingDays.map(d => daysMap[d.toLowerCase()]).filter(i => i !== undefined);
    
    this.formCalendarDays.forEach(day => {
      if (!day.otherMonth) {
        const dayIndex = day.date.getDay();
        day.disabled = workingDayIndices.length > 0 && !workingDayIndices.includes(dayIndex);
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
      next: (slots) => {
        console.log(`⏰ Horarios para ${dayName}:`, slots);
        this.availableTimeSlots = this.allTimeSlots.filter(s => slots.includes(s.time));
        
        if (this.availableTimeSlots.length === 0) {
          this.showError(`No hay horarios disponibles para ${dayName}`);
        }
      },
      error: () => {
        this.availableTimeSlots = [...this.allTimeSlots];
      }
    });
  }

  onServiceChange(): void {
    const services: { [key: string]: any } = {
      'manicure': { price: 25000, duration: '45 min', recommendation: 'Cada 2 semanas' },
      'pedicure': { price: 30000, duration: '60 min', recommendation: 'Cada 3 semanas' },
      'gelish': { price: 35000, duration: '60 min', recommendation: '2-3 semanas' },
      'acrilicas': { price: 50000, duration: '90 min', recommendation: 'Retoque cada 3 semanas' },
      'pestanas': { price: 40000, duration: '75 min', recommendation: 'Retoque cada 2-3 semanas' }
    };
    
    this.selectedService = services[this.form.appointmentService] || null;
  }

  getStaffName(staffId: string): string {
    const staff = this.staffList.find(s => 
      s.id === staffId || s.name === staffId || s.displayName === staffId
    );
    return staff?.name || staffId;
  }

  // ============================================
  // 🔥 UTILIDADES
  // ============================================
  
  switchView(view: 'list' | 'create'): void {
    console.log('🔄 Cambiando a vista:', view);
    this.currentView = view;
    this.clearMessages();
    
    if (view === 'create' && !this.isEditing) {
      this.resetForm();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    this.form = {
      clientDocType: '',
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
    console.log('✅', msg);
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    console.error('❌', msg);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
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

  // ============================================
  // 🔥 TRACK BY FUNCTIONS
  // ============================================
  
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