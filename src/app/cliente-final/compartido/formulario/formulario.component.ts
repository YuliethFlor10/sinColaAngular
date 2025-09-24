import { Component, ElementRef, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FormularioComponent implements AfterViewInit {
  currentStep = 1;
  currentDate = new Date();
  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  formData: any = {};

  @ViewChild('personalForm', { static: false }) personalForm!: ElementRef<HTMLFormElement>;
  @ViewChild('appointmentForm', { static: false }) appointmentForm!: ElementRef<HTMLFormElement>;

  ngAfterViewInit() {
    this.setupEventListeners();
    this.generateCalendar();
  }

  setupEventListeners() {
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
      personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStep1Submit();
      });
    }
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStep2Submit();
      });
    }
    const prevMonth = document.getElementById('prevMonth');
    if (prevMonth) {
      prevMonth.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
      });
    }
    const nextMonth = document.getElementById('nextMonth');
    if (nextMonth) {
      nextMonth.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
      });
    }
    this.setupTimeSlotListeners();
    const appointmentType = document.getElementById('appointmentType');
    if (appointmentType) {
      appointmentType.addEventListener('change', (e: any) => {
        this.updateServiceInfo(e.target.value);
      });
    }
  }

  setupTimeSlotListeners() {
    document.querySelectorAll('.time-slot').forEach((slot) => {
      slot.addEventListener('click', (e: any) => {
        this.selectTimeSlot(e.target);
      });
    });
  }

  handleStep1Submit() {
    const form = document.getElementById('personalForm') as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    this.formData.docType = (document.getElementById('docType') as HTMLSelectElement).value;
    this.formData.docNumber = (document.getElementById('docNumber') as HTMLInputElement).value;
    this.formData.fullName = (document.getElementById('fullName') as HTMLInputElement).value;
    this.formData.birthDate = (document.getElementById('birthDate') as HTMLInputElement).value;
    this.formData.email = (document.getElementById('email') as HTMLInputElement).value;
    this.formData.phone = (document.getElementById('phone') as HTMLInputElement).value;
    this.goToStep(2);
  }

  handleStep2Submit() {
    const form = document.getElementById('appointmentForm') as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!this.selectedDate) {
      alert('Por favor selecciona una fecha');
      return;
    }
    if (!this.selectedTime) {
      alert('Por favor selecciona una hora');
      return;
    }
    this.formData.appointmentType = (document.getElementById('appointmentType') as HTMLSelectElement).value;
    this.formData.staff = (document.getElementById('staff') as HTMLSelectElement).value;
    this.formData.date = this.selectedDate;
    this.formData.time = this.selectedTime;
    this.formData.observations = (document.getElementById('observations') as HTMLTextAreaElement).value;
    this.processReservation();
  }

  goToStep(step: number) {
    const currentStepEl = document.getElementById(`step${this.currentStep}`);
    if (currentStepEl) currentStepEl.classList.remove('active');
    const nextStepEl = document.getElementById(`step${step}`);
    if (nextStepEl) nextStepEl.classList.add('active');
    this.currentStep = step;
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = date.getDate().toString();
      if (date.getMonth() !== month) {
        dayElement.classList.add('other-month');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Marcar el día seleccionado
      if (
        this.selectedDate &&
        date.getDate() === this.selectedDate.getDate() &&
        date.getMonth() === this.selectedDate.getMonth() &&
        date.getFullYear() === this.selectedDate.getFullYear()
      ) {
        dayElement.classList.add('selected');
      }
      if (date < today) {
        dayElement.style.opacity = '0.3';
        dayElement.style.cursor = 'not-allowed';
      } else {
        dayElement.addEventListener('click', () => {
          this.selectedDate = date;
          this.generateCalendar();
          const options: Intl.DateTimeFormatOptions = {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          };
          const selectedDateText = document.getElementById('selectedDateText');
          if (selectedDateText) selectedDateText.textContent = date.toLocaleDateString('es-ES', options);
        });
      }
      calendarDays.appendChild(dayElement);
    }
    // Listeners para cambiar de mes
    const prevMonth = document.getElementById('prevMonth');
    if (prevMonth) {
      prevMonth.onclick = () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
      };
    }
    const nextMonth = document.getElementById('nextMonth');
    if (nextMonth) {
      nextMonth.onclick = () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
      };
    }
  }

  selectDate(date: Date, element: HTMLElement) {
    document.querySelectorAll('.calendar-day.selected').forEach((day) => {
      day.classList.remove('selected');
    });
    element.classList.add('selected');
    this.selectedDate = date;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    };
    const selectedDateText = document.getElementById('selectedDateText');
    if (selectedDateText) selectedDateText.textContent = date.toLocaleDateString('es-ES', options);
  }

  selectTimeSlot(element: HTMLElement) {
    document.querySelectorAll('.time-slot.selected').forEach((slot) => {
      slot.classList.remove('selected');
    });
    element.classList.add('selected');
    this.selectedTime = element.getAttribute('data-time');
  }

  updateServiceInfo(serviceType: string) {
    const serviceInfo: any = {
      manicure: { price: '$ 35.000', duration: '45 min' },
      pedicure: { price: '$ 45.000', duration: '1 H' },
      gelish: { price: '$ 50.000', duration: '1 H' },
      acrilicas: { price: '$ 65.000', duration: '1.5 H' },
      decoracion: { price: '$ 25.000', duration: '30 min' },
    };
    const info = serviceInfo[serviceType] || { price: '$ 50.000', duration: '1 H' };
    const serviceInfoElement = document.querySelector('.service-info');
    if (serviceInfoElement) {
      serviceInfoElement.innerHTML = `
        <span class="price">Valor: ${info.price}</span>
        <span class="duration">Duración: ${info.duration}</span>
        <span class="recommendation">Recomendación: para el procedimiento a realizar</span>
      `;
    }
  }

  processReservation() {
    const loadingMessage = document.createElement('div');
    loadingMessage.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; z-index: 999;`;
    loadingMessage.textContent = 'Procesando tu reserva...';
    document.body.appendChild(loadingMessage);
    setTimeout(() => {
      document.body.removeChild(loadingMessage);
      this.showConfirmationModal();
    }, 2000);
  }

  showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  resetForm() {
    this.goToStep(1);
    (document.getElementById('personalForm') as HTMLFormElement)?.reset();
    (document.getElementById('appointmentForm') as HTMLFormElement)?.reset();
    this.selectedDate = null;
    this.selectedTime = null;
    this.formData = {};
    document.querySelectorAll('.calendar-day.selected').forEach((day) => {
      day.classList.remove('selected');
    });
    document.querySelectorAll('.time-slot.selected').forEach((slot) => {
      slot.classList.remove('selected');
    });
    const selectedDateText = document.getElementById('selectedDateText');
    if (selectedDateText) selectedDateText.textContent = 'Día seleccionado';
  }
}

// Modal helpers for template
export function closeConfirmationModal() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  const comp = (window as any).formularioComponentInstance;
  if (comp) comp.resetForm();
}
