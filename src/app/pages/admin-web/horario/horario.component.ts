import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ScheduleService, DaySchedule, Staff } from '../../../services/schedule.service';

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
  
  // Lista de personal disponible
  staffList: Staff[] = [];
  
  // Configuración de horarios por día
  weekSchedule: DaySchedule[] = [];

  // Mensajes
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit() {
    console.log('Componente de horarios inicializado');
    
    // Cargar lista de personal
    this.staffList = this.scheduleService.getStaffList();
    
    // Cargar horarios del personal seleccionado por defecto
    this.loadScheduleForSelectedPerson();
  }

  /**
   * 📌 Cargar horarios cuando cambia la persona seleccionada
   */
  onPersonChange() {
    this.loadScheduleForSelectedPerson();
  }

  /**
   * 📌 Cargar horarios de la persona seleccionada
   */
  private loadScheduleForSelectedPerson() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.scheduleService.getScheduleByStaff(this.selectedPerson).subscribe({
      next: (schedules) => {
        this.weekSchedule = schedules;
        this.isLoading = false;
        console.log(`Horarios cargados para ${this.selectedPerson}`, schedules);
      },
      error: (err) => {
        this.errorMessage = `Error al cargar horarios: ${err.message}`;
        this.isLoading = false;
        console.error('Error cargando horarios:', err);
      }
    });
  }

  /**
   * 📌 Toggle de día abierto/cerrado
   */
  onDayToggle(day: DaySchedule) {
    console.log(`${day.name} cambiado a: ${day.isOpen ? 'Abierto' : 'Cerrado'}`);
    
    // Si el día se cierra, deshabilitar segundo turno
    if (!day.isOpen) {
      day.secondShift.enabled = false;
    }
  }

  /**
   * 📌 Habilitar/deshabilitar segundo turno
   */
  toggleSecondShift(day: DaySchedule) {
    day.secondShift.enabled = !day.secondShift.enabled;
    console.log(`Segundo turno para ${day.name}: ${day.secondShift.enabled ? 'Habilitado' : 'Deshabilitado'}`);
  }

  /**
   * 📌 Abrir selector de tiempo
   */
  openTimePicker(dayId: string, shiftType: 'firstShift' | 'secondShift', timeType: 'start' | 'end') {
    console.log(`Abriendo selector de tiempo para: ${dayId} - ${shiftType} - ${timeType}`);
    
    const currentTime = this.getCurrentTimeForSlot(dayId, shiftType, timeType);
    const newTime = prompt(`Ingrese la nueva hora (formato: 8:00 AM o 14:30 PM):`, currentTime);
    
    if (newTime && this.isValidTimeFormat(newTime)) {
      this.updateTimeSlot(dayId, shiftType, timeType, newTime);
    } else if (newTime) {
      alert('Formato de hora inválido. Use formato como: 8:00 AM o 2:30 PM');
    }
  }

  /**
   * 📌 Obtener tiempo actual del slot
   */
  private getCurrentTimeForSlot(dayId: string, shiftType: 'firstShift' | 'secondShift', timeType: 'start' | 'end'): string {
    const day = this.weekSchedule.find(d => d.id === dayId);
    if (day) {
      return day[shiftType][timeType].display;
    }
    return '';
  }

  /**
   * 📌 Validar formato de tiempo
   */
  private isValidTimeFormat(time: string): boolean {
    // Acepta formato 12 horas (8:00 AM) y 24 horas (14:30)
    const time12Regex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
    const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    return time12Regex.test(time.trim()) || time24Regex.test(time.trim());
  }

  /**
   * 📌 Actualizar slot de tiempo
   */
  private updateTimeSlot(dayId: string, shiftType: 'firstShift' | 'secondShift', timeType: 'start' | 'end', newTime: string) {
    const day = this.weekSchedule.find(d => d.id === dayId);
    if (day) {
      const timeObj = this.parseTime(newTime);
      if (timeObj) {
        day[shiftType][timeType] = timeObj;
        console.log(`Tiempo actualizado para ${dayId} ${shiftType} ${timeType}: ${newTime}`);
        this.successMessage = `✔ Hora actualizada para ${day.name}`;
        setTimeout(() => this.successMessage = '', 3000);
      }
    }
  }

  /**
   * 📌 Parsear string de tiempo a objeto TimeSlot
   */
  private parseTime(timeString: string): any | null {
    const trimmed = timeString.trim();
    
    // Intenta formato 12 horas (8:00 AM)
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match12) {
      let hour = parseInt(match12[1]);
      const minute = parseInt(match12[2]);
      const ampm = match12[3].toUpperCase() as 'AM' | 'PM';
      
      // Convierte a hora de 24 horas para almacenamiento interno
      let hour24 = hour;
      if (ampm === 'PM' && hour !== 12) {
        hour24 = hour + 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour24 = 0;
      }
      
      return {
        hour: hour24,
        minute: minute,
        ampm: ampm,
        display: `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`
      };
    }
    
    // Intenta formato 24 horas (14:30)
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hour24 = parseInt(match24[1]);
      const minute = parseInt(match24[2]);
      
      // Convierte a formato 12 horas para display
      let hour12 = hour24 % 12;
      if (hour12 === 0) hour12 = 12;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      
      return {
        hour: hour24,
        minute: minute,
        ampm: ampm,
        display: `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`
      };
    }
    
    return null;
  }

  /**
   * 📌 Guardar horarios
   */
  saveSchedule() {
    // Validación básica
    if (!this.weekSchedule || this.weekSchedule.length === 0) {
      this.errorMessage = '⚠ No hay horarios para guardar';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Guardando horarios:', {
      staff: this.selectedPerson,
      schedules: this.weekSchedule
    });

    this.scheduleService.saveSchedule(this.selectedPerson, this.weekSchedule).subscribe({
      next: (result) => {
        this.successMessage = `✔ Horarios de ${this.getStaffDisplayName()} guardados exitosamente`;
        this.isLoading = false;
        console.log('Horarios guardados:', result);
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = `⚠ Error al guardar horarios: ${err.message}`;
        this.isLoading = false;
        console.error('Error guardando horarios:', err);
      }
    });
  }

  /**
   * 📌 Obtener nombre completo del personal seleccionado
   */
  private getStaffDisplayName(): string {
    const staff = this.staffList.find(s => s.id === this.selectedPerson);
    return staff?.displayName || staff?.name || this.selectedPerson;
  }

  /**
   * 📌 Toggle sidebar
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * 📌 Verificar si hay al menos un día abierto
   */
  hasOpenDays(): boolean {
    return this.weekSchedule.some(day => day.isOpen);
  }

  /**
   * 📌 Contar días abiertos
   */
  getOpenDaysCount(): number {
    return this.weekSchedule.filter(day => day.isOpen).length;
  }
}