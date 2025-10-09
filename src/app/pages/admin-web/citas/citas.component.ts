import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, Appointment } from '../../../services/appointments.service';

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

  // Estado para alinear con el template HTML actual
  currentView: 'list' | 'create' = 'list';
  isLoading: boolean = false;
  appointments: Appointment[] = [];
  stats = { reserved: 0, confirmed: 0, cancelled: 0 };
  calendarDays: Array<{ number: number; selected?: boolean; otherMonth?: boolean; hasAppointments?: boolean }> = [];
  formCalendarDays: Array<{ number: number; selected?: boolean; otherMonth?: boolean }> = [];
  currentMonth: string = '';
  currentMonthForm: string = '';
  appointmentForm: any = {
    clientDocType: 'CC',
    clientDocNumber: '',
    clientName: '',
    clientEmail: '',
    clientBirthDate: '',
    clientPhone: '',
    appointmentService: '',
    appointmentStaff: 'Por asignar',
    appointmentObservations: ''
  };
  isEditing: boolean = false;
  selectedService: { price: number; duration: string; recommendation: string } | null = null;
  timeSlots: Array<{ time: string; display: string; selected?: boolean }> = [
    { time: '09:00', display: '9:00 am' },
    { time: '09:30', display: '9:30 am' },
    { time: '10:30', display: '10:30 am' },
    { time: '11:00', display: '11:00 am' },
    { time: '14:30', display: '2:30 pm' },
    { time: '15:00', display: '3:00 pm' },
    { time: '15:30', display: '3:30 pm' },
    { time: '17:30', display: '5:30 pm' }
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentsService: AppointmentsService
  ) {}

  ngOnInit(): void {
    this.initFormCalendar();
    this.initForm();
    this.cargarCitas();
  }

  /**
   * Inicializar formulario reactivo
   */
  private initForm(): void {
    this.citaForm = this.fb.group({
      clientName: ['', Validators.required],
      serviceName: ['', Validators.required],
      day: ['', Validators.required],
      monthName: ['', Validators.required],
      time: ['', Validators.required],
      status: ['reserved', Validators.required],
      nota: ['']
    });
  }

  /**
   * Cambio de servicio
   */
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

  /**
   * 📌 Cargar todas las citas desde el backend
   */
  cargarCitas(): void {
    this.isLoading = true;
    this.appointmentsService.getAll().subscribe({
      next: (data: Appointment[]) => {
        this.citas = data;
        this.appointments = data;
        this.computeStats(data);
        this.isLoading = false;
        console.log('✅ Citas cargadas:', data);
      },
      error: (err: any) => {
        this.errorMessage = `Error al cargar citas: ${err?.message || 'Intente nuevamente.'}`;
        this.isLoading = false;
        console.error('❌ Error al cargar citas:', err);
      }
    });
  }

  /**
   * 📌 Enviar formulario (crear o actualizar)
   */
  onSubmit(): void {
    // Construye payload desde ngModel + selecciones
    const selectedDay = this.formCalendarDays.find(d => d.selected)?.number;
    const selectedTime = this.timeSlots.find(t => t.selected)?.time || this.appointmentForm.time || '09:00';
    const monthName = this.currentMonthForm?.split(' ')[0] || 'ENERO';

    // ⚠️ Validaciones básicas
    if (!this.appointmentForm.clientName || this.appointmentForm.clientName.trim() === '') {
      this.errorMessage = '❌ Por favor ingrese el nombre del cliente';
      return;
    }

    if (!this.appointmentForm.appointmentService || this.appointmentForm.appointmentService === '') {
      this.errorMessage = '❌ Por favor seleccione un servicio';
      return;
    }

    if (!selectedDay) {
      this.errorMessage = '❌ Por favor seleccione una fecha en el calendario';
      return;
    }

    if (!selectedTime) {
      this.errorMessage = '❌ Por favor seleccione una hora';
      return;
    }

    // ✅ Construir payload con TODOS los campos requeridos
    const payload: Appointment = {
      // Campos principales del frontend
      clientName: this.appointmentForm.clientName.trim(),
      clientEmail: this.appointmentForm.clientEmail?.trim() || 'cliente@ejemplo.com',
      serviceName: this.appointmentForm.appointmentService,
      staffName: this.appointmentForm.appointmentStaff || 'Por asignar',
      day: selectedDay,
      monthName: monthName,
      time: selectedTime,
      status: 'reserved',
      nota: this.appointmentForm.appointmentObservations?.trim() || '',
      
      // ⚠️ Campos del backend (REQUERIDOS)
      tipo_documento: this.appointmentForm.clientDocType || 'CC',
      numero_documento: this.appointmentForm.clientDocNumber?.trim() || '0000000000',
      nombre: this.appointmentForm.clientName.trim(), // ← Importante: nombre para el backend
      email: this.appointmentForm.clientEmail?.trim() || 'cliente@ejemplo.com',
      fecha_nacimiento: this.appointmentForm.clientBirthDate || '2000-01-01',
      numero_telefono: this.appointmentForm.clientPhone?.trim() || '3000000000',
      tipo_cita: this.appointmentForm.appointmentService, // ← Importante: tipo_cita para el backend
      personal_servicio: this.appointmentForm.appointmentStaff || 'Por asignar',
      negocios_id: 1,
      status_id: 1 // 1 = reserved/pendiente
    };

    console.log('📤 Enviando payload:', payload);
    this.isLoading = true;
    this.errorMessage = ''; // Limpiar errores previos

    if (this.isEditing && this.editingId) {
      // 🔄 ACTUALIZAR CITA
      this.appointmentsService.update(this.editingId, payload).subscribe({
        next: (response) => {
          this.successMessage = '✔ Cita actualizada correctamente';
          this.errorMessage = '';
          this.resetForm();
          this.switchView('list');
          this.cargarCitas();
          console.log('✅ Cita actualizada:', response);
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => { this.successMessage = ''; }, 5000);
        },
        error: (err: any) => {
          this.errorMessage = `❌ Error al actualizar: ${err?.message || 'Intente nuevamente.'}`;
          this.isLoading = false;
          console.error('❌ Error al actualizar:', err);
        }
      });
    } else {
      // ➕ CREAR CITA
      this.appointmentsService.create(payload).subscribe({
        next: (response) => {
          this.successMessage = '✔ Cita creada exitosamente';
          this.errorMessage = '';
          this.resetForm();
          this.switchView('list');
          this.cargarCitas();
          console.log('✅ Cita creada:', response);
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => { this.successMessage = ''; }, 5000);
        },
        error: (err: any) => {
          this.errorMessage = `❌ Error al crear: ${err?.message || 'Intente nuevamente.'}`;
          this.isLoading = false;
          console.error('❌ Error al crear:', err);
        }
      });
    }
  }

  /**
   * 📌 Editar cita
   */
  editAppointment(appointment: Appointment): void {
    this.isEditing = true;
    this.editingId = appointment.id ?? null;
    
    // Cargar datos en el formulario ngModel
    this.appointmentForm = {
      clientDocType: appointment.tipo_documento || 'CC',
      clientDocNumber: appointment.numero_documento || '',
      clientName: appointment.clientName,
      clientEmail: appointment.email || appointment.clientEmail || '',
      clientBirthDate: appointment.fecha_nacimiento || '',
      clientPhone: appointment.numero_telefono || '',
      appointmentService: appointment.serviceName,
      appointmentStaff: appointment.personal_servicio || appointment.staffName || 'Por asignar',
      appointmentObservations: appointment.nota || ''
    };
    
    // Seleccionar fecha y hora
    this.timeSlots.forEach(s => s.selected = (s.time === appointment.time));
    if (typeof appointment.day === 'number') {
      this.formCalendarDays.forEach(d => d.selected = d.number === appointment.day);
      this.selectedDateText = `Día ${appointment.day}`;
    }
    
    this.switchView('create');
    console.log('✏️ Editando cita:', appointment);
  }

  /**
   * 📌 Eliminar cita
   */
  deleteAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    
    const confirmacion = confirm(
      `¿Está seguro de eliminar la cita de ${appointment.clientName}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    this.isLoading = true;
    this.appointmentsService.delete(appointment.id).subscribe({
      next: () => {
        this.successMessage = `🗑 Cita de ${appointment.clientName} eliminada`;
        this.errorMessage = '';
        this.cargarCitas();
        console.log('✅ Cita eliminada');
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => { this.successMessage = ''; }, 5000);
      },
      error: (err: any) => {
        this.errorMessage = `❌ Error al eliminar: ${err?.message || 'Intente nuevamente.'}`;
        this.isLoading = false;
        console.error('❌ Error al eliminar:', err);
      }
    });
  }

  /**
   * 📌 Confirmar cita
   */
  confirmAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    
    this.isLoading = true;
    this.appointmentsService.changeStatus(appointment.id, 'confirmed').subscribe({
      next: () => {
        this.successMessage = `✔ Cita de ${appointment.clientName} confirmada`;
        this.errorMessage = '';
        this.cargarCitas();
        console.log('✅ Cita confirmada');
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => { this.successMessage = ''; }, 5000);
      },
      error: (err: any) => {
        this.errorMessage = `❌ Error al confirmar: ${err?.message || 'Intente nuevamente.'}`;
        this.isLoading = false;
        console.error('❌ Error al confirmar:', err);
      }
    });
  }

  /**
   * 📌 Cancelar cita
   */
  cancelAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    
    const razon = prompt('¿Motivo de la cancelación?');
    if (!razon) return;

    this.isLoading = true;
    this.appointmentsService.cancel(appointment.id, razon).subscribe({
      next: () => {
        this.successMessage = `❌ Cita de ${appointment.clientName} cancelada`;
        this.errorMessage = '';
        this.cargarCitas();
        console.log('✅ Cita cancelada');
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => { this.successMessage = ''; }, 5000);
      },
      error: (err: any) => {
        this.errorMessage = `❌ Error al cancelar: ${err?.message || 'Intente nuevamente.'}`;
        this.isLoading = false;
        console.error('❌ Error al cancelar:', err);
      }
    });
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.appointmentForm = {
      clientDocType: 'CC',
      clientDocNumber: '',
      clientName: '',
      clientEmail: '',
      clientBirthDate: '',
      clientPhone: '',
      appointmentService: '',
      appointmentStaff: 'Por asignar',
      appointmentObservations: ''
    };
    this.timeSlots.forEach(s => s.selected = false);
    this.formCalendarDays.forEach(d => d.selected = false);
    this.selectedDateText = '';
    this.selectedService = null;
    this.isLoading = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Cancelar edición
   */
  cancelEdit(): void {
    this.resetForm();
    this.switchView('list');
  }

  /**
   * Cambiar vista
   */
  switchView(view: 'list' | 'create'): void {
    this.currentView = view;
    this.successMessage = '';
    this.errorMessage = '';
    if (view === 'create' && !this.isEditing) {
      this.resetForm();
    }
  }

  /**
   * Recargar datos
   */
  reloadData(): void {
    this.cargarCitas();
  }

  /**
   * Seleccionar fecha en el calendario
   */
  selectDate(day: { number: number }): void {
    this.formCalendarDays.forEach(d => d.selected = false);
    const found = this.formCalendarDays.find(d => d.number === day.number);
    if (found) {
      found.selected = true;
      this.selectedDateText = `Día ${day.number}`;
    }
  }

  /**
   * Seleccionar hora
   */
  selectTime(slot: { time: string; display: string; selected?: boolean }): void {
    this.timeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    this.appointmentForm.time = slot.time;
  }

  /**
   * Toggle menú de opciones
   */
  toggleMenu(event: Event, appointment: any): void {
    event.stopPropagation();
    appointment.showMenu = !appointment.showMenu;
  }

  /**
   * Inicializar calendario del formulario
   */
  private initFormCalendar(): void {
    const now = new Date();
    const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    this.formCalendarDays = Array.from({ length: lastDay }, (_, i) => ({ number: i + 1 }));
    this.currentMonthForm = `${months[monthIndex]} ${year}`;
    this.currentMonth = this.currentMonthForm;
  }

  /**
   * Calcular estadísticas
   */
  private computeStats(list: Appointment[]): void {
    const reserved = list.filter(a => a.status === 'reserved').length;
    const confirmed = list.filter(a => a.status === 'confirmed').length;
    const cancelled = list.filter(a => a.status === 'cancelled').length;
    this.stats = { reserved, confirmed, cancelled };
  }

  /**
   * Track by functions para *ngFor
   */
  trackDay(_: number, item: { number: number }): number { 
    return item.number; 
  }
  
  trackAppointment(_: number, item: Appointment): number { 
    return item.id ?? 0; 
  }
  
  trackSlot(_: number, item: { time: string }): string { 
    return item.time; 
  }
}