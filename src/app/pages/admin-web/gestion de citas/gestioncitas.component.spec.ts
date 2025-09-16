import { Component } from '@angular/core';

@Component({
  selector: 'app-gestioncitas',
  templateUrl: './gestioncitas.component.html',
  styleUrls: ['./gestioncitas.component.css']
})
export class GestioncitasComponent {
  // Datos de prueba
  documentTypes = [
    { value: 'cc', label: 'Cédula de ciudadanía' },
    { value: 'ce', label: 'Cédula de extranjería' },
    { value: 'ti', label: 'Tarjeta de identidad' }
  ];

  appointmentTypes = [
    { value: 'consulta', label: 'Consulta médica', price: 50000, duration: '30 min', recommendation: 'Llegar 10 min antes' },
    { value: 'odontologia', label: 'Odontología', price: 80000, duration: '45 min', recommendation: 'No comer antes' },
  ];

  staffMembers = [
    { value: 'doctor1', label: 'Dr. Pérez' },
    { value: 'doctor2', label: 'Dra. Gómez' }
  ];

  selectedAppointmentInfo: any = null;

  // Calendario
  currentMonthYear = 'Septiembre 2025';
  calendarDays = [
    { day: 1, isToday: false, isSelected: false, isOtherMonth: false },
    { day: 2, isToday: true, isSelected: false, isOtherMonth: false },
    { day: 3, isToday: false, isSelected: false, isOtherMonth: false },
  ];

  // Horas
  timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'];
  selectedTime: string | null = null;

  // Métodos
  onAppointmentTypeChange() {
    const selectedType = this.appointmentTypes.find(
      type => type.value === (document.getElementById('appointment-type') as HTMLSelectElement).value
    );
    this.selectedAppointmentInfo = selectedType || null;
  }

  selectDate(day: any) {
    this.calendarDays.forEach(d => d.isSelected = false);
    day.isSelected = true;
  }

  prevMonth() {
    console.log('Mes anterior');
  }

  nextMonth() {
    console.log('Mes siguiente');
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }
}
