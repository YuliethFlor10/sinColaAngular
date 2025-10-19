import { Component, OnInit, Inject, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, Appointment } from '../../../services/appointments.service';
import { ScheduleService, Staff } from '../../../services/schedule.service'; // 🔥 NUEVO

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

  currentView: 'list' | 'create' = 'list';
  isLoading: boolean = false;
  appointments: Appointment[] = [];
  stats = { reserved: 0, confirmed: 0, cancelled: 0 };
  calendarDays: Array<{ number: number; selected?: boolean; otherMonth?: boolean; hasAppointments?: boolean }> = [];
  formCalendarDays: Array<{ number: number; selected?: boolean; otherMonth?: boolean; disabled?: boolean }> = []; // 🔥 MODIFICADO
  currentMonth: string = '';
  currentMonthForm: string = '';
  appointmentForm: any = {};
  isEditing: boolean = false;
  selectedService: { price: number; duration: string; recommendation: string } | null = null;
  
  // 🔥 NUEVO: Staff y horarios disponibles
  staffList: Staff[] = [];
  availableTimeSlots: Array<{ time: string; display: string; selected?: boolean }> = [];
  workingDays: string[] = [];
  
  // Lista original de slots (backup)
  private originalTimeSlots: Array<{ time: string; display: string; selected?: boolean }> = [
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

  timeSlots: Array<{ time: string; display: string; selected?: boolean }> = [];

  private appointmentsService!: AppointmentsService;

  constructor(
    private fb: FormBuilder,
    private injector: Injector,
    private scheduleService: ScheduleService // 🔥 NUEVO
  ) {
    this.appointmentsService = this.injector.get(AppointmentsService);
  }

  ngOnInit(): void {
    this.cargarCitas();

    // 🔥 NUEVO: Cargar lista de personal
    this.staffList = this.scheduleService.getStaffList();
    console.log('📋 Personal cargado:', this.staffList);

    this.citaForm = this.fb.group({
      clientName: ['', Validators.required],
      serviceName: ['', Validators.required],
      day: ['', Validators.required],
      monthName: ['', Validators.required],
      time: ['', Validators.required],
      status: ['pendiente', Validators.required],
      nota: [''],
      staffName: [''] // 🔥 NUEVO
    });

    this.initFormCalendar();
    
    // Inicializar slots
    this.timeSlots = [...this.originalTimeSlots];
    this.availableTimeSlots = [...this.originalTimeSlots];
  }

  // 🔥 NUEVO: Cuando cambia el personal seleccionado
  onStaffChange(): void {
    const staffId = this.appointmentForm.appointmentStaff;
    
    if (!staffId) {
      // Si no hay personal, mostrar todos los slots y habilitar todos los días
      this.availableTimeSlots = [...this.originalTimeSlots];
      this.timeSlots = [...this.originalTimeSlots];
      this.updateCalendarWithWorkingDays([]);
      this.workingDays = [];
      this.errorMessage = '';
      return;
    }

    console.log('👤 Personal seleccionado:', staffId);

    // Cargar días laborables del personal
    this.scheduleService.getWorkingDays(staffId).subscribe({
      next: (days) => {
        this.workingDays = days;
        console.log(`📅 Días laborables de ${staffId}:`, days);
        
        // Actualizar calendario para deshabilitar días no laborables
        this.updateCalendarWithWorkingDays(days);
        
        // Si ya hay un día seleccionado, verificar si sigue siendo válido
        const selectedDay = this.formCalendarDays.find(d => d.selected);
        if (selectedDay) {
          if (selectedDay.disabled) {
            // Deseleccionar si el día ya no es válido
            selectedDay.selected = false;
            this.selectedDateText = '';
            this.availableTimeSlots = [];
            this.timeSlots = [];
            this.errorMessage = '⚠ El día seleccionado no es laborable para este personal. Seleccione otro día.';
          } else {
            // Actualizar horarios disponibles
            this.updateAvailableTimeSlots(staffId, selectedDay.number);
          }
        }
      },
      error: (err) => {
        console.error('❌ Error cargando días laborables:', err);
        this.errorMessage = '⚠ No se pudieron cargar los horarios del personal';
      }
    });
  }

  // 🔥 NUEVO: Actualizar calendario con días laborables
  private updateCalendarWithWorkingDays(workingDays: string[]): void {
    const daysMap: { [key: string]: number } = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'sábado': 6
    };

    // Helper: normaliza una cadena (quita acentos y pasa a minúsculas)
    const normalize = (s: string | undefined) => {
      if (!s) return '';
      // Compat: usar rango Unicode para diacríticos para evitar problemas con \p{Diacritic}
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    // Mapa para convertir nombres en inglés a español normalizado
    const enToEs: { [key: string]: string } = {
      'sunday': 'domingo', 'monday': 'lunes', 'tuesday': 'martes', 'wednesday': 'miercoles',
      'thursday': 'jueves', 'friday': 'viernes', 'saturday': 'sabado'
    };

    // Normaliza la lista de workingDays y convierte nombres en inglés si es necesario
    const normalizedWorking = new Set<string>(workingDays.map(w => {
      const n = normalize(w);
      return enToEs[n] || n;
    }));

    // Determinar mes/año mostrado actualmente en el calendario (p. ej. "OCTUBRE 2025")
    const monthsUpper = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    let year = new Date().getFullYear();
    let month = new Date().getMonth();
    if (this.currentMonthForm) {
      const parts = String(this.currentMonthForm).split(' ');
      if (parts.length >= 2) {
        const m = parts[0].toUpperCase();
        const idx = monthsUpper.indexOf(m);
        if (idx >= 0) month = idx;
        const y = parseInt(parts[1], 10);
        if (!isNaN(y)) year = y;
      }
    }

    this.formCalendarDays.forEach(day => {
      // Ignorar placeholder de otro mes
      if ((day as any).otherMonth) {
        day.disabled = true;
        return;
      }

      // Usar la fecha almacenada si existe (más precisa), sino construirla
      const dateObj = (day as any).date instanceof Date ? (day as any).date : new Date(year, month, day.number);
      // Obtener el nombre del día en español a partir del índice
      const dayIndex = dateObj.getDay(); // 0 domingo .. 6 sabado
      const spanishNames = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
      const dayNameNorm = spanishNames[dayIndex];

      // Deshabilitar si el personal no trabaja ese día
      day.disabled = normalizedWorking.size > 0 && !normalizedWorking.has(dayNameNorm);
    });
  }

  // 🔥 NUEVO: Actualizar slots de tiempo disponibles según el personal y día
  private updateAvailableTimeSlots(staffId: string, dayNumber: number): void {
    // Usar el mes/año actualmente mostrado en el calendario
    const monthsUpper = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    let year = new Date().getFullYear();
    let month = new Date().getMonth();
    if (this.currentMonthForm) {
      const parts = String(this.currentMonthForm).split(' ');
      if (parts.length >= 2) {
        const m = parts[0].toUpperCase();
        const idx = monthsUpper.indexOf(m);
        if (idx >= 0) month = idx;
        const y = parseInt(parts[1], 10);
        if (!isNaN(y)) year = y;
      }
    }
    const date = new Date(year, month, dayNumber);
    
    // Convertir day index a nombre en español (sin acentos)
    const spanishNames = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
    const dayName = spanishNames[date.getDay()];

    this.scheduleService.getAvailableTimeSlotsForDay(staffId, dayName).subscribe({
      next: (slots) => {
        console.log(`⏰ Horarios disponibles para ${dayName}:`, slots);
        
        // Filtrar los slots originales para mostrar solo los disponibles
        this.availableTimeSlots = this.originalTimeSlots.filter(slot => 
          slots.includes(slot.time)
        );
        
        this.timeSlots = [...this.availableTimeSlots];
        
        if (this.availableTimeSlots.length === 0) {
          this.errorMessage = `⚠ El personal no tiene horarios disponibles para ${dayName}`;
        } else {
          this.errorMessage = '';
        }
      },
      error: (err) => {
        console.error('❌ Error cargando slots disponibles:', err);
        this.availableTimeSlots = [...this.originalTimeSlots];
        this.timeSlots = [...this.originalTimeSlots];
      }
    });
  }

  onServiceChange(): void {
    const services: Record<string, { price: number; duration: string; recommendation: string }> = {
      manicure: { price: 35000, duration: '45 min', recommendation: 'Hidratar manos antes' },
      pedicure: { price: 45000, duration: '1 H', recommendation: 'Llevar sandalias' },
      gelish: { price: 50000, duration: '1 H', recommendation: 'Evitar contacto con químicos' },
      acrilicas: { price: 65000, duration: '1.5 H', recommendation: 'Planificar tiempo suficiente' },
      pestanas: { price: 80000, duration: '1.5 H', recommendation: 'No usar maquillaje de ojos' }
    };
    const key = this.appointmentForm.appointmentService;
    this.selectedService = services[key] || null;
  }

  cargarCitas(): void {
    this.isLoading = true;
    this.appointmentsService.getAll().subscribe({
      next: (data: Appointment[]) => {
        this.citas = data;
        this.appointments = data;
        this.computeStats(data);
        this.isLoading = false;
        if (data.length === 0) {
          this.seedTestAppointments();
        }
      },
      error: (err: unknown) => {
        const anyErr = err as { message?: string };
        this.errorMessage = `Error al cargar citas: ${anyErr?.message || 'Intente nuevamente.'}`;
        this.isLoading = false;
        console.error('cargarCitas error:', err);
        this.loadLocalSampleAppointments();
      }
    });
  }

  private loadLocalSampleAppointments(): void {
    const month = this.currentMonthForm.split(' ')[0] || 'ENERO';
    const samples: Appointment[] = [
      { clientName: 'Cliente Local', serviceName: 'manicure', day: new Date().getDate(), monthName: month, time: '09:00', status: 'reserved', nota: 'Datos locales', staffName: 'Pepita Perez' },
      { clientName: 'María Prueba', serviceName: 'pedicure', day: new Date().getDate(), monthName: month, time: '10:30', status: 'confirmed', nota: 'Confirmada (local)', staffName: 'Luna Lunera' }
    ];
    this.citas = samples;
    this.appointments = samples;
    this.computeStats(samples);
    this.successMessage = 'Cargando datos de ejemplo locales (API inaccesible)';
  }

  guardarCita(): void {
    if (this.citaForm.invalid) return;

    const cita = this.citaForm.value;

    if (this.editingId) {
      this.appointmentsService.update(this.editingId, cita).subscribe({
        next: () => {
          this.successMessage = `✔ Cita de ${cita.clientName} actualizada correctamente`;
          this.errorMessage = '';
          this.editingId = null;
          this.citaForm.reset();
          this.cargarCitas();
        },
        error: (err: unknown) => {
          const anyErr = err as { message?: string };
          this.errorMessage = `Error al actualizar la cita: ${anyErr?.message || 'Intente nuevamente.'}`;
        }
      });
    } else {
      this.appointmentsService.create(cita).subscribe({
        next: () => {
          this.successMessage = `✔ Cita creada para ${cita.clientName}`;
          this.errorMessage = '';
          this.citaForm.reset();
          this.cargarCitas();
        },
        error: (err: unknown) => {
          const anyErr = err as { message?: string };
          this.errorMessage = `Error al crear la cita: ${anyErr?.message || 'Intente nuevamente.'}`;
        }
      });
    }
  }

  editarCita(cita: any): void {
    this.editingId = cita.id;
    this.citaForm.patchValue(cita);
    this.successMessage = `✏ Formulario cargado para edición de ${cita.clientName}. Modifique los datos y guarde.`;
  }

  eliminarCita(id: number, clientName: string): void {
    const confirmacion = confirm(
      `¿Está seguro de eliminar la cita de ${clientName}?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmacion) {
      this.appointmentsService.delete(id).subscribe({
        next: () => {
          this.successMessage = `🗑 Cita de ${clientName} eliminada correctamente`;
          this.errorMessage = '';
          this.cargarCitas();
        },
        error: (err: unknown) => {
          const anyErr = err as { message?: string };
          this.errorMessage = `Error al eliminar la cita: ${anyErr?.message || 'Intente nuevamente.'}`;
        }
      });
    }
  }

  cambiarEstado(id: number, clientName: string, nuevoEstado: string): void {
    // Buscar la cita actual para pasarla al servicio y asegurar que todos los datos se envíen
    const citaActual = this.citas.find(c => c.id === id);
    this.appointmentsService.changeStatus(id, nuevoEstado, citaActual).subscribe({
      next: () => {
        this.successMessage = `🔄 Estado de la cita de ${clientName} cambiado a "${nuevoEstado}"`;
        this.errorMessage = '';
        this.cargarCitas();
      },
      error: (err: unknown) => {
        const anyErr = err as { message?: string };
        const msg = anyErr?.message || 'Intente nuevamente.';
        // Detectar error de columna faltante en la BD (SQLSTATE 42S22)
        if (String(msg).includes('42S22') || String(msg).includes('Unknown column') || String(msg).includes('estados_id')) {
          // Informar que se aplicó la confirmación en la interfaz como fallback
          this.successMessage = `✔ Cita marcada como "${nuevoEstado}" en la interfaz (backend no soporta 'estados_id').`;
          this.errorMessage = '';
          return;
        }

        this.errorMessage = `Error al cambiar estado de la cita: ${msg}`;
      }
    });
  }

  switchView(view: 'list' | 'create'): void {
    this.currentView = view;
    this.successMessage = '';
    this.errorMessage = '';
  }

  reloadData(): void {
    this.cargarCitas();
  }

  trackDay(_: number, item: { number: number }): number { return item.number; }
  trackAppointment(_: number, item: Appointment): number { return item.id ?? 0; }
  trackSlot(_: number, item: { time: string }): string { return item.time; }

  /**
   * Retorna el nombre del personal por su id usando la lista cargada en el componente.
   * Evita llamar a métodos privados del servicio desde la plantilla.
   */
  getStaffName(staffId: string | undefined): string {
    if (!staffId) return '';
    const staff = this.staffList.find(s => s.id === staffId || s.name === staffId || s.displayName === staffId);
    return staff ? staff.name : staffId;
  }

  // 🔥 MODIFICADO: Validar disponibilidad al seleccionar fecha
  selectDate(day: { number: number; disabled?: boolean }): void {
    // No permitir seleccionar placeholders u otros meses
    if ((day as any).otherMonth) return;
    if (day.disabled) {
      this.errorMessage = '⚠ El personal no trabaja este día. Seleccione otro día.';
      return;
    }

    this.formCalendarDays.forEach(d => d.selected = false);
    const found = this.formCalendarDays.find(d => d.number === day.number);
    if (found) found.selected = true;
    this.selectedDateText = `Día ${day.number}`;

    // 🔥 NUEVO: Actualizar horarios disponibles según el personal y día seleccionado
    const staffId = this.appointmentForm.appointmentStaff;
    if (staffId) {
      // Si el objeto day incluye la fecha real, usar day.number, else still pass number
      this.updateAvailableTimeSlots(staffId, day.number);
    } else {
      this.errorMessage = '⚠ Seleccione primero el personal';
    }
  }

  selectTime(slot: { time: string; display: string; selected?: boolean }): void {
    this.timeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    this.appointmentForm.time = slot.time;
  }

  toggleMenu(event: Event, appointment: any): void {
    event.stopPropagation();
    appointment.showMenu = !appointment.showMenu;
  }

  confirmAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    // Marcado optimista en UI para que el usuario vea el cambio inmediatamente
    appointment.status = 'confirmed';
    this.computeStats(this.appointments);
    this.cambiarEstado(appointment.id, appointment.clientName, 'confirmed');
  }

  cancelAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.cambiarEstado(appointment.id, appointment.clientName, 'cancelled');
  }

  editAppointment(appointment: Appointment): void {
    this.isEditing = true;
    this.editingId = appointment.id ?? null;
    
    this.citaForm.patchValue({
      clientName: appointment.clientName,
      serviceName: appointment.serviceName,
      day: appointment.day,
      monthName: appointment.monthName,
      time: appointment.time,
      status: appointment.status,
      nota: appointment.nota || '',
      staffName: appointment.staffName || ''
    });

    this.appointmentForm = {
      clientDocType: '',
      clientDocNumber: '',
      clientName: appointment.clientName,
      clientEmail: '',
      clientBirthDate: '',
      clientPhone: '',
      appointmentService: appointment.serviceName,
      appointmentStaff: appointment.staffName || '',
      appointmentObservations: appointment.nota || ''
    };
    
    this.timeSlots.forEach(s => s.selected = (s.time === appointment.time));
    if (typeof appointment.day === 'number') {
      this.formCalendarDays.forEach(d => d.selected = d.number === appointment.day);
    }
    
    // 🔥 NUEVO: Cargar horarios del personal
    if (appointment.staffName) {
      this.onStaffChange();
    }
    
    this.switchView('create');
  }

  deleteAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.eliminarCita(appointment.id, appointment.clientName);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingId = null;
    this.citaForm.reset();
    this.appointmentForm = {};
    this.switchView('list');
  }

  onSubmit(): void {

    const selectedDay = this.formCalendarDays.find(d => d.selected)?.number;
    const selectedTime = this.timeSlots.find(t => t.selected)?.time || this.appointmentForm.time;
    const monthName = this.currentMonthForm?.split(' ')[0] || this.currentMonth || '';
    const staffId = this.appointmentForm.appointmentStaff || '';

    // 🔥 NUEVO: Validaciones
    if (!staffId) {
      this.errorMessage = '⚠ Debe seleccionar el personal que atenderá la cita';
      return;
    }

    if (!selectedDay) {
      this.errorMessage = '⚠ Debe seleccionar una fecha';
      return;
    }

    if (!selectedTime) {
      this.errorMessage = '⚠ Debe seleccionar una hora';
      return;
    }

    // Encontrar el nombre del staff
    const staff = this.staffList.find(s => s.id === staffId);
    const staffName = staff?.name || staffId;

    // Tomar todos los datos del formulario para el payload
    const payload: Appointment = {
      id: this.isEditing ? this.editingId ?? undefined : undefined,
      clientName: this.appointmentForm.clientName || this.citaForm.value.clientName || 'Cliente',
      clientEmail: this.appointmentForm.clientEmail || this.citaForm.value.clientEmail || '',
      clientDocType: this.appointmentForm.clientDocType || this.citaForm.value.clientDocType || '',
      clientDocNumber: this.appointmentForm.clientDocNumber || this.citaForm.value.clientDocNumber || '',
      clientBirthDate: this.appointmentForm.clientBirthDate || this.citaForm.value.clientBirthDate || '',
      clientPhone: this.appointmentForm.clientPhone || this.citaForm.value.clientPhone || '',
      serviceName: this.appointmentForm.appointmentService || this.citaForm.value.serviceName || 'manicure',
      day: selectedDay || this.citaForm.value.day || new Date().getDate(),
      monthName: monthName || this.citaForm.value.monthName || 'ENERO',
      time: selectedTime || this.citaForm.value.time || '09:00',
      status: this.isEditing ? (this.citaForm.value.status || 'reserved') : 'reserved',
      nota: this.appointmentForm.appointmentObservations || this.citaForm.value.nota || '',
      staffName: staffName
    };

    this.isLoading = true;
    if (this.isEditing && this.editingId) {
      this.appointmentsService.update(this.editingId, payload).subscribe({
        next: () => {
          this.successMessage = '✔ Cambios guardados';
          this.errorMessage = '';
          this.isEditing = false;
          this.editingId = null;
          this.isLoading = false;
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
          this.successMessage = '✔ Cita creada';
          this.errorMessage = '';
          this.isLoading = false;
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

  private initFormCalendar(): void {
    const now = new Date();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    // Calcular offset para que la semana comience en Lunes (columna 0 = Lunes)
    const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0=Dom
    const offset = (firstDayIndex + 6) % 7; // convierte domingo(0)->6, lunes(1)->0, etc.

    const days: Array<any> = [];
    // Añadir placeholders para los días anteriores del mes (otherMonth = true)
    for (let i = 0; i < offset; i++) {
      days.push({ number: 0, otherMonth: true });
    }

    // Añadir días reales con la fecha almacenada
    for (let d = 1; d <= lastDay; d++) {
      days.push({ number: d, date: new Date(year, monthIndex, d) });
    }

    this.formCalendarDays = days;
    this.currentMonthForm = `${months[monthIndex]} ${year}`;
  }

  private computeStats(list: Appointment[]): void {
    const reserved = list.filter(a => a.status === 'reserved').length;
    const confirmed = list.filter(a => a.status === 'confirmed').length;
    const cancelled = list.filter(a => a.status === 'cancelled').length;
    this.stats = { reserved, confirmed, cancelled };
  }

  private seedTestAppointments(): void {
    const month = this.currentMonthForm.split(' ')[0] || 'ENERO';
    const samples: Appointment[] = [
      { clientName: 'Cliente Demo', serviceName: 'manicure', day: new Date().getDate(), monthName: month, time: '09:00', status: 'reserved', nota: 'Cita de prueba', staffName: 'Pepita Perez' },
      { clientName: 'Ana Ejemplo', serviceName: 'pedicure', day: new Date().getDate(), monthName: month, time: '10:30', status: 'confirmed', nota: 'Confirmada demo', staffName: 'Luna Lunera' }
    ];
    samples.forEach(s => {
      this.appointmentsService.create(s).subscribe({
        next: () => this.cargarCitas(),
        error: () => {}
      });
    });
  }
}