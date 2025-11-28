import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";
import { ScheduleService, DaySchedule, Staff } from '../../../services/schedule.service';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../services/auth.service';

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

  // Persona seleccionada (Empresa por defecto)
  selectedPerson: string = 'empresa';

  staffList: Staff[] = [];
  weekSchedule: DaySchedule[] = [];

  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isLoadingStaff = true;

  // 🔥 Negocio actual
  currentBusinessId: number = 1;
  currentBusinessName: string = '';

  constructor(
    private scheduleService: ScheduleService,
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('🚀 ========================================');
    console.log('🚀 HorarioComponent inicializado');
    console.log('🚀 ========================================');

    // Obtener información del negocio actual
    const user = this.authService.getCurrentUser();
    if (user?.negocios_id) {
      this.currentBusinessId = user.negocios_id;
      this.currentBusinessName = user.business?.nombre || `Negocio ${this.currentBusinessId}`;
      console.log(`🏢 Negocio actual: ${this.currentBusinessName} (ID: ${this.currentBusinessId})`);
    } else {
      console.warn('⚠️ No se pudo obtener el negocio actual del usuario');
    }

    // Cargar personal del negocio
    this.loadStaffFromBusiness();
  }

  /** ================================
   * 🔥 CARGAR PERSONAL DEL NEGOCIO
   * (Empleados + Administradores)
   *================================*/
  private loadStaffFromBusiness(): void {
    console.log('📡 Cargando personal del negocio para horarios...');
    this.isLoadingStaff = true;
    this.errorMessage = '';

    this.usersService.getStaffByBusiness(this.currentBusinessId).subscribe({
      next: (staffData: any) => {
        console.log('📥 Personal recibido:', staffData);

        // Transformar datos del personal al formato Staff
        const staffForSchedule: Staff[] = staffData.map((u: any) => ({
          id: u.id.toString(),
          name: u.nombre,
          displayName: u.nombre,
          role: u.rol?.nombre || 'Personal',
          email: u.email || ''
        }));

        console.log('✅ Personal transformado:', staffForSchedule);

        // 🔥 ACTUALIZAR EL SCHEDULESERVICE CON LA LISTA REAL
        this.scheduleService.setStaffList(staffForSchedule);

        // Obtener lista completa (incluye "Empresa" + personal real)
        this.staffList = this.scheduleService.getStaffList();
        
        console.log('📋 Lista final en selector:', this.staffList);
        
        this.isLoadingStaff = false;

        // Cargar horario de la persona seleccionada por defecto
        this.loadScheduleForSelectedPerson();
      },
      error: (err) => {
        console.error('❌ Error cargando personal del negocio:', err);
        this.errorMessage = 'Error al cargar el personal del negocio';
        this.isLoadingStaff = false;

        // Fallback: usar solo "Empresa"
        this.staffList = this.scheduleService.getStaffList();
        this.loadScheduleForSelectedPerson();
      }
    });
  }

  /** ================================
   * Cambiar persona y recargar horario
   *================================*/
  onPersonChange(): void {
    console.log('👤 Persona seleccionada para configurar horario:', this.selectedPerson);
    this.loadScheduleForSelectedPerson();
  }

  /** ================================
   * Cargar horario de la persona actual
   *================================*/
  private loadScheduleForSelectedPerson(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.scheduleService.getScheduleByStaff(this.selectedPerson).subscribe({
      next: (schedules: DaySchedule[]) => {
        this.weekSchedule = schedules;
        this.isLoading = false;
        console.log(`✅ Horario cargado para ${this.getStaffDisplayName()}:`, schedules);
      },
      error: (err) => {
        console.error('❌ Error cargando horarios:', err);
        this.errorMessage = 'Error cargando horarios';
        this.isLoading = false;
      }
    });
  }

  /** ================================
   * Handler usado en el template cuando se cambia el checkbox "isOpen"
   *================================*/
  public onDayToggle(day: DaySchedule): void {
    console.log(`${day.name} cambiado a: ${day.isOpen ? 'Abierto' : 'Cerrado'}`);
    if (!day.isOpen) {
      day.secondShift.enabled = false;
    }
  }

  /** ================================
   * Handler para alternar segundo turno
   *================================*/
  public toggleSecondShift(day: DaySchedule): void {
    day.secondShift.enabled = !day.secondShift.enabled;
    console.log(`Segundo turno para ${day.name}: ${day.secondShift.enabled ? 'Habilitado' : 'Deshabilitado'}`);
  }

  /** ================================
   * Abrir selector de tiempo
   *================================*/
  public openTimePicker(
    dayId: string,
    shift: 'firstShift' | 'secondShift',
    timeType: 'start' | 'end'
  ): void {
    console.log(`Abriendo selector de tiempo: ${dayId} ${shift} ${timeType}`);

    const currentTime = this.getCurrentTimeForSlot(dayId, shift, timeType);
    const newTime = prompt(`Ingrese la nueva hora (Ej: 8:00 AM):`, currentTime);

    if (newTime && this.isValidTimeFormat(newTime)) {
      this.updateTimeSlot(dayId, shift, timeType, newTime);
    } else if (newTime) {
      alert('Formato inválido. Use 8:00 AM o 14:30');
    }
  }

  /** Obtener tiempo actual del slot */
  private getCurrentTimeForSlot(
    dayId: string,
    shift: 'firstShift' | 'secondShift',
    timeType: 'start' | 'end'
  ): string {
    const day = this.weekSchedule.find(d => d.id === dayId);
    if (!day) return '';
    return (day as any)[shift][timeType].display ?? '';
  }

  /** Validar formatos de hora */
  private isValidTimeFormat(time: string): boolean {
    const time12Regex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
    const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return time12Regex.test(time.trim()) || time24Regex.test(time.trim());
  }

  /** Actualizar slot de tiempo */
  private updateTimeSlot(
    dayId: string,
    shift: 'firstShift' | 'secondShift',
    timeType: 'start' | 'end',
    newTime: string
  ): void {
    const day = this.weekSchedule.find(d => d.id === dayId);
    if (!day) return;

    const timeObj = this.parseTime(newTime);
    if (!timeObj) return;

    (day as any)[shift][timeType] = timeObj;

    this.successMessage = `✓ Hora actualizada para ${day.name}`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  /** Parseo a objeto TimeSlot */
  private parseTime(timeString: string) {
    const trimmed = timeString.trim();

    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match12) {
      let hour = parseInt(match12[1], 10);
      const minute = parseInt(match12[2], 10);
      const ampm = match12[3].toUpperCase() as 'AM' | 'PM';

      let hour24 = hour;
      if (ampm === 'PM' && hour !== 12) hour24 = hour + 12;
      if (ampm === 'AM' && hour === 12) hour24 = 0;

      return {
        hour: hour24,
        minute,
        ampm,
        display: `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`
      };
    }

    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hour24 = parseInt(match24[1], 10);
      const minute = parseInt(match24[2], 10);
      let hour12 = hour24 % 12;
      if (hour12 === 0) hour12 = 12;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';

      return {
        hour: hour24,
        minute,
        ampm,
        display: `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`
      };
    }

    return null;
  }

  /** Guardar horarios */
  public saveSchedule(): void {
    if (!this.weekSchedule || this.weekSchedule.length === 0) {
      this.errorMessage = '⚠ No hay horarios para guardar';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.scheduleService.saveSchedule(this.selectedPerson, this.weekSchedule).subscribe({
      next: (result) => {
        this.successMessage = `✓ Horarios de ${this.getStaffDisplayName()} guardados exitosamente`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        console.error('❌ Error guardando horarios:', err);
        this.errorMessage = 'Error guardando horarios';
        this.isLoading = false;
      }
    });
  }

  private getStaffDisplayName(): string {
    const staff = this.staffList.find(s => s.id === this.selectedPerson);
    return staff?.displayName || staff?.name || this.selectedPerson;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  hasOpenDays(): boolean {
    return this.weekSchedule.some(day => day.isOpen);
  }

  getOpenDaysCount(): number {
    return this.weekSchedule.filter(day => day.isOpen).length;
  }
}