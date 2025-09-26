import { Component, OnInit, Inject, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminWeb } from '../admin-web';
import { ContenidoComponent } from '../../../compartido/components/contenido/contenido.component';
import { AppointmentsService, Appointment } from '../../../services/appointments.service';
import { HttpClient } from '@angular/common/http';

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
  appointmentForm: any = {};
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

  private appointmentsService!: AppointmentsService;

  constructor(
    private fb: FormBuilder,
    private injector: Injector
    
  ) {
    this.appointmentsService = this.injector.get(AppointmentsService);
  }

  ngOnInit(): void {
    this.cargarCitas();

    this.citaForm = this.fb.group({
      clientName: ['', Validators.required],
      serviceName: ['', Validators.required],
      day: ['', Validators.required],
      monthName: ['', Validators.required],
      time: ['', Validators.required],
      status: ['pendiente', Validators.required],
      nota: ['']
    });

    this.initFormCalendar();
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

  // 📌 Listar citas
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
        console.error(err);
      }
    });
  }

  // 📌 Guardar (crear o editar)
  guardarCita(): void {
    if (this.citaForm.invalid) return;

    const cita = this.citaForm.value;

    if (this.editingId) {
      // Editar
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
      // Crear
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

  // 📌 Cargar datos en el formulario para editar
  editarCita(cita: any): void {
    this.editingId = cita.id;
    this.citaForm.patchValue(cita);
    this.successMessage = `✏ Formulario cargado para edición de ${cita.clientName}. Modifique los datos y guarde.`;
  }

  // 📌 Eliminar cita
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

  // 📌 Cambiar estado (ejemplo: confirmar, cancelar)
  cambiarEstado(id: number, clientName: string, nuevoEstado: string): void {
    this.appointmentsService.changeStatus(id, nuevoEstado).subscribe({
      next: () => {
        this.successMessage = `🔄 Estado de la cita de ${clientName} cambiado a "${nuevoEstado}"`;
        this.errorMessage = '';
        this.cargarCitas();
      },
      error: (err: unknown) => {
        const anyErr = err as { message?: string };
        this.errorMessage = `Error al cambiar estado de la cita: ${anyErr?.message || 'Intente nuevamente.'}`;
      }
    });
  }

  // Métodos auxiliares para el template existente
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

  selectDate(day: { number: number }): void {
    this.formCalendarDays.forEach(d => d.selected = false);
    const found = this.formCalendarDays.find(d => d.number === day.number);
    if (found) found.selected = true;
    this.selectedDateText = `Día ${day.number}`;
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
    this.cambiarEstado(appointment.id, appointment.clientName, 'confirmed');
  }

  cancelAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.cambiarEstado(appointment.id, appointment.clientName, 'cancelled');
  }

  // 📌 MÉTODO EDITAPPOINTMENT MEJORADO
  editAppointment(appointment: Appointment): void {
    this.isEditing = true;
    this.editingId = appointment.id ?? null;
    
    // Cargar datos en el formulario ngModel con campos adicionales de Laravel
    this.appointmentForm = {
      clientDocType: (appointment as any).tipo_documento || 'cedula',
      clientDocNumber: (appointment as any).numero_documento || '',
      clientName: appointment.clientName,
      clientEmail: (appointment as any).clientEmail || '',
      clientBirthDate: (appointment as any).fecha_nacimiento || '',
      clientPhone: (appointment as any).numero_telefono || '',
      appointmentService: appointment.serviceName,
      appointmentStaff: (appointment as any).staffName || '',
      appointmentObservations: appointment.nota || ''
    };

    // Sincronizar con formulario reactivo
    this.citaForm.patchValue({
      clientName: appointment.clientName,
      serviceName: appointment.serviceName,
      day: appointment.day,
      monthName: appointment.monthName,
      time: appointment.time,
      status: appointment.status,
      nota: appointment.nota || ''
    });

    // Seleccionar tiempo y fecha en la UI
    this.timeSlots.forEach(s => s.selected = (s.time === appointment.time));
    if (typeof appointment.day === 'number') {
      this.formCalendarDays.forEach(d => d.selected = d.number === appointment.day);
      this.selectedDateText = `Día ${appointment.day}`;
    }

    this.switchView('create');
    this.successMessage = `📝 Editando cita de ${appointment.clientName}`;
  }

  deleteAppointment(appointment: Appointment): void {
    if (!appointment.id) return;
    this.eliminarCita(appointment.id, appointment.clientName);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingId = null;
    this.appointmentForm = {};
    this.citaForm.reset();
    this.timeSlots.forEach(s => s.selected = false);
    this.formCalendarDays.forEach(d => d.selected = false);
    this.selectedDateText = '';
    this.switchView('list');
  }

  // 📌 MÉTODO ONSUBMIT MEJORADO
  onSubmit(): void {
    // Validar datos mínimos requeridos
    if (!this.appointmentForm.clientName && !this.appointmentForm.nombre) {
      this.errorMessage = 'El nombre del cliente es requerido';
      return;
    }

    if (!this.appointmentForm.appointmentService && !this.appointmentForm.tipo_cita) {
      this.errorMessage = 'El tipo de cita es requerido';
      return;
    }

    // Construye payload con los campos de Laravel
    const selectedDay = this.formCalendarDays.find(d => d.selected)?.number;
    const selectedTime = this.timeSlots.find(t => t.selected)?.time || this.appointmentForm.time;
    const monthName = this.currentMonthForm?.split(' ')[0] || this.currentMonth || '';

    const payload: Partial<Appointment> = {
      // Campos básicos para tu template actual
      clientName: this.appointmentForm.clientName || 'Cliente',
      serviceName: this.appointmentForm.appointmentService || 'Servicio',
      day: selectedDay || new Date().getDate(),
      monthName: monthName || 'ENERO',
      time: selectedTime || '09:00',
      status: this.isEditing ? 'reserved' : 'reserved',
      nota: this.appointmentForm.appointmentObservations,
      
      // Campos adicionales de Laravel
      clientEmail: this.appointmentForm.clientEmail,
      staffName: this.appointmentForm.appointmentStaff,
      tipo_documento: this.appointmentForm.clientDocType || 'CC',
      numero_documento: this.appointmentForm.clientDocNumber,
      fecha_nacimiento: this.appointmentForm.clientBirthDate,
      numero_telefono: this.appointmentForm.clientPhone
    };

    if (this.isEditing && this.editingId) {
      payload.id = this.editingId;
    }

    this.isLoading = true;

    const operation = this.isEditing && this.editingId ? 
      this.appointmentsService.update(this.editingId, payload) :
      this.appointmentsService.create(payload);

    operation.subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.successMessage = this.isEditing ? '✅ Cita actualizada correctamente' : '✅ Cita creada correctamente';
        this.errorMessage = '';
        this.isEditing = false;
        this.editingId = null;
        this.isLoading = false;
        
        // Limpiar formulario
        this.appointmentForm = {};
        this.timeSlots.forEach(s => s.selected = false);
        this.formCalendarDays.forEach(d => d.selected = false);
        this.selectedDateText = '';
        
        this.switchView('list');
        this.cargarCitas();
      },
      error: (error) => {
        console.error('Error completo:', error);
        let errorMsg = 'Error desconocido';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        } else if (error.error?.errors) {
          // Errores de validación Laravel
          const validationErrors = Object.values(error.error.errors).flat();
          errorMsg = validationErrors.join(', ');
        }
        
        this.errorMessage = `❌ ${this.isEditing ? 'Error al actualizar' : 'Error al crear'} la cita: ${errorMsg}`;
        this.isLoading = false;
      }
    });
  }

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

  private computeStats(list: Appointment[]): void {
    const reserved = list.filter(a => a.status === 'reserved').length;
    const confirmed = list.filter(a => a.status === 'confirmed').length;
    const cancelled = list.filter(a => a.status === 'cancelled').length;
    this.stats = { reserved, confirmed, cancelled };
  }

  private seedTestAppointments(): void {
    const month = this.currentMonthForm.split(' ')[0] || 'ENERO';
    const samples: Appointment[] = [
      { clientName: 'Cliente Demo', serviceName: 'manicure', day: new Date().getDate(), monthName: month, time: '09:00', status: 'reserved', nota: 'Cita de prueba' },
      { clientName: 'Ana Ejemplo', serviceName: 'pedicure', day: new Date().getDate(), monthName: month, time: '10:30', status: 'confirmed', nota: 'Confirmada demo' }
    ];
    samples.forEach(s => {
      this.appointmentsService.create(s).subscribe({
        next: () => this.cargarCitas(),
        error: () => {}
      });
    });
  }
}