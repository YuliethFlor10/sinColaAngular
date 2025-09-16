import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { DecimalPipe, NgIf } from '@angular/common';
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
  imports: [AdminWeb, ContenidoComponent, ReactiveFormsModule, DecimalPipe, NgIf]
})

export class CitasComponent implements OnInit {
  form: FormGroup;

  // datos demo (reemplaza con los tuyos)
  documentTypes = [
    { value: 'cc', label: 'Cédula de ciudadanía' },
    { value: 'ti', label: 'Tarjeta de identidad' }
  ];

  appointmentTypes = [
    { value: 'consulta', label: 'Consulta', price: 50000, duration: '1 H', recommendation: 'Recomendación para consulta' },
    { value: 'procedimiento', label: 'Procedimiento', price: 80000, duration: '2 H', recommendation: 'Recomendación para procedimiento' }
  ];

  staffMembers = [
    { value: 'juan', label: 'Juan Pérez' },
    { value: 'maria', label: 'María López' }
  ];

  selectedAppointmentInfo = { price: 0, duration: '', recommendation: '' };

  // calendario
  currentMonthDate = new Date(); // cualquier día dentro del mes actual
  currentMonthYear = '';
  calendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;

  // horas
  timeSlots: string[] = ['8:00 am','10:30 am','11:00 am','2:30 pm','3:00 pm','3:30 pm','5:30 pm'];
  selectedTime: string | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      documentType: [''],
      documentNumber: [''],
      name: [''],
      email: [''],
      birthDate: [''],
      phone: [''],
      appointmentType: [''],
      staff: [''],
      observations: ['']
    });
  }

  ngOnInit(): void {
    this.updateMonthTitle();
    this.buildCalendar();
  }

  /* ---------- Appointment type change ---------- */
  onAppointmentTypeChange() {
    const val = this.form.get('appointmentType')?.value;
    const found = this.appointmentTypes.find(t => t.value === val);
    if (found) {
      this.selectedAppointmentInfo = {
        price: found.price,
        duration: found.duration,
        recommendation: found.recommendation
      };
    } else {
      this.selectedAppointmentInfo = { price: 0, duration: '', recommendation: '' };
    }
  }

  /* ---------- Calendar helpers ---------- */
  updateMonthTitle() {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    this.currentMonthYear = this.currentMonthDate.toLocaleDateString('es-ES', options);
  }

  buildCalendar() {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    // primer día del mes
    const firstOfMonth = new Date(year, month, 1);
    // índice de día con inicio Lunes (0 = Lunes, ... 6 = Domingo)
    const weekdayIndex = (firstOfMonth.getDay() + 6) % 7;
    // inicio del grid (el lunes anterior si aplica)
    const startDate = new Date(year, month, 1 - weekdayIndex);

    const days: CalendarDay[] = [];
    const today = new Date();
    // generar 6 semanas -> 42 días (siempre)
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

  prevMonth() {
    this.currentMonthDate = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() - 1, 1);
    this.updateMonthTitle();
    this.buildCalendar();
  }

  nextMonth() {
    this.currentMonthDate = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() + 1, 1);
    this.updateMonthTitle();
    this.buildCalendar();
  }

  selectDate(dayObj: CalendarDay) {
    if (dayObj.isOtherMonth) return;
    this.selectedDate = new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), dayObj.date.getDate());
    // actualizar flags
    this.calendarDays.forEach(d => d.isSelected = (
      d.date.getFullYear() === this.selectedDate!.getFullYear() &&
      d.date.getMonth() === this.selectedDate!.getMonth() &&
      d.date.getDate() === this.selectedDate!.getDate()
    ));
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  getSelectedDateInfo(): string {
    if (!this.selectedDate) return 'Día seleccionado';
    return this.selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  getSelectedTimeInfo(): string {
    return this.selectedTime ? this.selectedTime : 'Hora seleccionada';
  }

  onSubmit() {
    if (this.form.invalid) {
      // opcional: marcar controles como touched
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      ...this.form.value,
      date: this.selectedDate,
      time: this.selectedTime
    };
    console.log('Crear cita ->', payload);
    // aquí iría tu llamada al servicio para crear la cita
  }
}
