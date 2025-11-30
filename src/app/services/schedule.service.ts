// ========================================
// 🔥 ScheduleService
// Servicio para gestionar:
// - Personal (staff)
// - Horarios por cada persona
// - Días laborables
// - Generación de slots de tiempo
// ========================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';

// -------------------------
// Interfaces del horario
// -------------------------

export interface TimeSlot {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  display: string;
}

export interface Shift {
  enabled: boolean;
  start: TimeSlot;
  end: TimeSlot;
}

export interface DaySchedule {
  id: string;      // monday, tuesday, ...
  name: string;    // Lunes, Martes...
  isOpen: boolean; // Si se trabaja ese día
  firstShift: Shift;
  secondShift: Shift;
}

export interface Staff {
  id: string;
  name: string;
  displayName: string;
  role?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  // URL base de tu API Laravel
  private baseUrl = 'http://127.0.0.1:8000/api';

  // Lista del personal cargado externamente
  private staffList: Staff[] = [];

  // Caché de horarios por persona
  private scheduleCache: Map<string, DaySchedule[]> = new Map();

  constructor(private http: HttpClient) {}

  // --------------------------------------------
  // 🔐 Generar headers con token de autenticación
  // --------------------------------------------
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // --------------------------------------------
  // 🔥 Método usado por el componente Horario
  // Este servicio YA NO carga usuarios desde API
  // Solo devuelve el staff almacenado internamente
  // --------------------------------------------
  loadStaffFromAPI(): Observable<Staff[]> {
    return of(this.getStaffList()).pipe(delay(100));
  }

  // --------------------------------------------
  // 🔥 Recibe la lista de personal desde otro servicio
  // Añade automáticamente a "Empresa"
  // --------------------------------------------
  setStaffList(list: Staff[]): void {
    const empresa: Staff = {
      id: 'empresa',
      name: 'Empresa',
      displayName: 'Horario General de la Empresa',
      role: 'Admin'
    };

    this.staffList = [empresa, ...list];
  }

  // Devuelve la lista completa del staff
  getStaffList(): Staff[] {
    if (this.staffList.length === 0) {
      return [{
        id: 'empresa',
        name: 'Empresa',
        displayName: 'Horario General de la Empresa',
        role: 'Admin'
      }];
    }
    return this.staffList;
  }

  // --------------------------------------------
  // 🔥 Devuelve el horario de un usuario (staff)
  // Usa caché para evitar múltiples llamadas
  // --------------------------------------------
  getScheduleByStaff(staffId: string): Observable<DaySchedule[]> {
    console.log(`📅 Obteniendo horario para: ${staffId}`);

    // Si ya está en caché, lo devuelve inmediatamente
    if (this.scheduleCache.has(staffId)) {
      console.log(`✅ Horario encontrado en caché para: ${staffId}`);
      return of(this.scheduleCache.get(staffId)!);
    }

    // Aquí se podría usar API real
    // const url = `${this.baseUrl}/schedules/${staffId}`;
    // return this.http.get(url, { headers: this.getHeaders() });

    // Por ahora usa horario por defecto
    console.log(`🔨 Creando horario por defecto para: ${staffId}`);
    const schedule = this.getDefaultSchedule();
    this.scheduleCache.set(staffId, schedule);

    return of(schedule).pipe(delay(200));
  }

  // --------------------------------------------
  // 🔥 Retorna los días laborables en un array
  // --------------------------------------------
  getWorkingDays(staffId: string): Observable<string[]> {
    return this.getScheduleByStaff(staffId).pipe(
      map((schedules: DaySchedule[]) => {
        return schedules
          .filter(day => day.isOpen)
          .map(day => this.mapDayIdToSpanishName(day.id));
      })
    );
  }

  // --------------------------------------------
  // 🔥 Retorna los horarios disponibles de un día
  // --------------------------------------------
  getAvailableTimeSlotsForDay(staffId: string, dayName: string): Observable<string[]> {
    return this.getScheduleByStaff(staffId).pipe(
      map((schedules: DaySchedule[]) => {
        const dayId = this.mapSpanishNameToDayId(dayName);
        const daySchedule = schedules.find(d => d.id === dayId);

        if (!daySchedule || !daySchedule.isOpen) return [];

        const slots: string[] = [];

        // Primer turno
        if (daySchedule.firstShift.enabled) {
          slots.push(
            ...this.generateTimeSlots(daySchedule.firstShift.start, daySchedule.firstShift.end)
          );
        }

        // Segundo turno
        if (daySchedule.secondShift.enabled) {
          slots.push(
            ...this.generateTimeSlots(daySchedule.secondShift.start, daySchedule.secondShift.end)
          );
        }

        return slots;
      })
    );
  }

  // --------------------------------------------
  // 🔧 Genera intervalos de 30 min entre horas
  // --------------------------------------------
  private generateTimeSlots(start: TimeSlot, end: TimeSlot): string[] {
    const slots: string[] = [];
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;

    for (let m = startMinutes; m < endMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    return slots;
  }

  // Mapear ID → Español
  private mapDayIdToSpanishName(id: string): string {
    const map: any = {
      monday: 'lunes',
      tuesday: 'martes',
      wednesday: 'miercoles',
      thursday: 'jueves',
      friday: 'viernes',
      saturday: 'sabado',
      sunday: 'domingo',
    };
    return map[id] || id;
  }

  // Mapear Español → ID
  private mapSpanishNameToDayId(es: string): string {
    const map: any = {
      lunes: 'monday',
      martes: 'tuesday',
      miercoles: 'wednesday',
      jueves: 'thursday',
      viernes: 'friday',
      sabado: 'saturday',
      domingo: 'sunday',
    };
    return map[es.toLowerCase()] || es;
  }

  // --------------------------------------------
  // 💾 Guardar horario (por ahora simulado)
  // --------------------------------------------
  saveSchedule(staffId: string, schedules: DaySchedule[]): Observable<any> {
    console.log(`💾 Guardando horario para: ${staffId}`, schedules);
    this.scheduleCache.set(staffId, schedules);

    return of({
      success: true,
      message: 'Horario guardado correctamente'
    }).pipe(delay(400));
  }

  // --------------------------------------------
  // 🔧 Horario por defecto (base)
  // --------------------------------------------
  private getDefaultSchedule(): DaySchedule[] {
    return [
      {
        id: 'monday',
        name: 'Lunes',
        isOpen: true,
        firstShift: {
          enabled: true,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: true,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      },
      {
        id: 'tuesday',
        name: 'Martes',
        isOpen: true,
        firstShift: {
          enabled: true,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: true,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      },
      {
        id: 'wednesday',
        name: 'Miércoles',
        isOpen: true,
        firstShift: {
          enabled: true,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: true,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      },
      {
        id: 'thursday',
        name: 'Jueves',
        isOpen: true,
        firstShift: {
          enabled: true,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: true,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      },
      {
        id: 'friday',
        name: 'Viernes',
        isOpen: true,
        firstShift: {
          enabled: true,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: true,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      },
      {
        id: 'saturday',
        name: 'Sábado',
        isOpen: false,
        firstShift: {
          enabled: false,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: false,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      },
      {
        id: 'sunday',
        name: 'Domingo',
        isOpen: false,
        firstShift: {
          enabled: false,
          start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
          end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
        },
        secondShift: {
          enabled: false,
          start: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' },
          end: { hour: 18, minute: 0, ampm: 'PM', display: '6:00 PM' }
        }
      }
    ];
  }

  // Limpia la caché interna
  clearCache(): void {
    this.scheduleCache.clear();
  }
}