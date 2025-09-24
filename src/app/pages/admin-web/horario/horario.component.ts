import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

interface TimeSlot {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  display: string;
}

interface DaySchedule {
  name: string;
  id: string;
  isOpen: boolean;
  firstShift: {
    start: TimeSlot;
    end: TimeSlot;
  };
  secondShift: {
    start: TimeSlot;
    end: TimeSlot;
    enabled: boolean;
  };
}

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminWeb,
    ContenidoComponent
  ]
})
export class HorarioComponent implements OnInit {
  sidebarOpen = false;
  selectedPerson = 'empresa';

  // Configuración de horarios por día
  weekSchedule: DaySchedule[] = [
    {
      name: 'Domingo',
      id: 'domingo',
      isOpen: false,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    },
    {
      name: 'Lunes',
      id: 'lunes',
      isOpen: true,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    },
    {
      name: 'Martes',
      id: 'martes',
      isOpen: true,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    },
    {
      name: 'Miércoles',
      id: 'miercoles',
      isOpen: true,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    },
    {
      name: 'Jueves',
      id: 'jueves',
      isOpen: true,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    },
    {
      name: 'Viernes',
      id: 'viernes',
      isOpen: true,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    },
    {
      name: 'Sábado',
      id: 'sabado',
      isOpen: true,
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    }
  ];

  constructor() {}

  ngOnInit() {
    // Inicialización del componente
    console.log('Componente de horarios inicializado');
  }

  onDayToggle(day: DaySchedule) {
    console.log(`${day.name} cambiado a: ${day.isOpen ? 'Abierto' : 'Cerrado'}`);

    // Si el día se cierra, deshabilitar segundo turno
    if (!day.isOpen) {
      day.secondShift.enabled = false;
    }
  }

  toggleSecondShift(day: DaySchedule) {
    day.secondShift.enabled = !day.secondShift.enabled;
    console.log(`Segundo turno para ${day.name}: ${day.secondShift.enabled ? 'Habilitado' : 'Deshabilitado'}`);
  }

  openTimePicker(dayId: string, shiftType: 'firstShift' | 'secondShift', timeType: 'start' | 'end') {
    // Aquí puedes implementar un modal o selector de tiempo
    console.log(`Abriendo selector de tiempo para: ${dayId} - ${shiftType} - ${timeType}`);

    // Por ahora solo un alert de demostración
    const currentTime = this.getCurrentTimeForSlot(dayId, shiftType, timeType);
    const newTime = prompt(`Ingrese la nueva hora (formato: 8:00 AM):`, currentTime);

    if (newTime && this.isValidTimeFormat(newTime)) {
      this.updateTimeSlot(dayId, shiftType, timeType, newTime);
    }
  }

  private getCurrentTimeForSlot(dayId: string, shiftType: 'firstShift' | 'secondShift', timeType: 'start' | 'end'): string {
    const day = this.weekSchedule.find(d => d.id === dayId);
    if (day) {
      return day[shiftType][timeType].display;
    }
    return '';
  }

  private isValidTimeFormat(time: string): boolean {
    // Validación básica para formato de tiempo como "8:00 AM" o "12:30 PM"
    const timeRegex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time.trim());
  }

  private updateTimeSlot(dayId: string, shiftType: 'firstShift' | 'secondShift', timeType: 'start' | 'end', newTime: string) {
    const day = this.weekSchedule.find(d => d.id === dayId);
    if (day) {
      // Parsear el tiempo
      const timeObj = this.parseTime(newTime);
      if (timeObj) {
        day[shiftType][timeType] = timeObj;
        console.log(`Tiempo actualizado para ${dayId} ${shiftType} ${timeType}: ${newTime}`);
      }
    }
  }

  private parseTime(timeString: string): TimeSlot | null {
    const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const ampm = match[3].toUpperCase() as 'AM' | 'PM';

      return {
        hour: ampm === 'PM' && hour !== 12 ? hour + 12 : (ampm === 'AM' && hour === 12 ? 0 : hour),
        minute: minute,
        ampm: ampm,
        display: timeString.trim()
      };
    }
    return null;
  }

  saveSchedule() {
    console.log('Guardando horarios:', this.weekSchedule);
    console.log('Personal seleccionado:', this.selectedPerson);

    // Aquí implementarías la lógica para enviar los datos al servidor
    alert('Horarios guardados exitosamente');
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
