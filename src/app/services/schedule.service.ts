import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

// 📌 Interfaz para slots de tiempo
export interface TimeSlot {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  display: string;
}

// 📌 Interfaz para turnos
export interface Shift {
  enabled: boolean;
  start: TimeSlot;
  end: TimeSlot;
}

// 📌 Interfaz para horario de un día (UI Component)
export interface DaySchedule {
  id: string;
  name: string;
  isOpen: boolean;
  firstShift: Shift;
  secondShift: Shift;
}

// 📌 Interfaz para personal
export interface Staff {
  id: string;
  name: string;
  displayName: string;
  email?: string;
  role?: string;
}

// 📌 Interfaz para Schedule (Backend API)
export interface Schedule {
  id: number;
  staff_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  // 🔥 DATOS TEMPORALES - Mientras se implementa en backend
  private mockStaffList: Staff[] = [
    { id: 'empresa', name: 'Empresa', displayName: 'Horario de la Empresa', role: 'Administrador' },
    { id: '1', name: 'Yulieth', displayName: 'Yulieth - Especialista en Uñas', email: 'yulieth@ejemplo.com', role: 'Empleado' },
    { id: '2', name: 'Juanita', displayName: 'Juanita - Especialista en Pestañas', email: 'juanita@ejemplo.com', role: 'Empleado' },
    { id: '3', name: 'Pablito', displayName: 'Pablito - Barbero', email: 'pablito@ejemplo.com', role: 'Empleado' }
  ];

  private mockSchedules: { [staffId: string]: string[] } = {
    'empresa': ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
    '1': ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
    '2': ['lunes', 'miercoles', 'viernes', 'sabado'],
    '3': ['martes', 'jueves', 'sabado']
  };

  private mockTimeSlots: { [staffId: string]: { [day: string]: string[] } } = {
    'empresa': {
      'lunes': ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      'martes': ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      'miercoles': ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      'jueves': ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      'viernes': ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      'sabado': ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
    },
    '1': {
      'lunes': ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'],
      'martes': ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      'miercoles': ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'],
      'jueves': ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
      'viernes': ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00']
    },
    '2': {
      'lunes': ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
      'miercoles': ['10:00', '11:00', '12:00', '15:00', '16:00'],
      'viernes': ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
      'sabado': ['09:00', '10:00', '11:00', '12:00']
    },
    '3': {
      'martes': ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
      'jueves': ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
      'sabado': ['09:00', '10:00', '11:00', '12:00', '14:00']
    }
  };

  constructor(private http: HttpClient) {
    console.log('ScheduleService inicializado');
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * 📌 Obtener lista de personal
   */
  getStaffList(): Staff[] {
    return this.mockStaffList;
  }

  /**
   * 📌 Obtener horarios por personal (formato DaySchedule para UI)
   */
  getScheduleByStaff(staffId: string): Observable<DaySchedule[]> {
    console.log(`📅 Cargando horarios para: ${staffId}`);

    // Simular carga desde backend
    const schedules = this.getDefaultSchedule();

    // Simular delay de red
    return of(schedules).pipe(delay(500));
  }

  /**
   * 📌 Guardar horarios (formato DaySchedule desde UI)
   */
  saveSchedule(staffId: string, schedules: DaySchedule[]): Observable<any> {
    console.log('💾 Guardando horarios:', { staffId, schedules });

    // Simular guardado en backend
    const result = {
      success: true,
      message: 'Horarios guardados exitosamente',
      staffId: staffId,
      timestamp: new Date().toISOString()
    };

    // Simular delay de red
    return of(result).pipe(delay(800));
  }

  /**
   * 🔥 Obtener días laborables de un miembro del personal
   * @param staffId ID del empleado
   * @returns Observable con array de días en español (ej: ['lunes', 'martes'])
   */
  getWorkingDays(staffId: string): Observable<string[]> {
    console.log('📅 Obteniendo días laborables para staff:', staffId);

    // 🔥 TEMPORAL: Retornar datos mock
    const days = this.mockSchedules[staffId] || [];
    return of(days);

    // TODO: Implementar llamada real cuando el endpoint esté disponible
    // return this.http.get<any>(`${this.baseUrl}/schedules/staff/${staffId}/working-days`, {
    //   headers: this.getHeaders()
    // }).pipe(
    //   map(response => response.days || []),
    //   catchError(error => {
    //     console.error('Error obteniendo días laborables:', error);
    //     return of([]);
    //   })
    // );
  }

  /**
   * 🔥 Obtener horarios disponibles para un día específico
   * @param staffId ID del empleado
   * @param dayName Nombre del día en español (ej: 'lunes')
   * @returns Observable con array de horarios (ej: ['09:00', '10:00'])
   */
  getAvailableTimeSlotsForDay(staffId: string, dayName: string): Observable<string[]> {
    console.log(`⏰ Obteniendo horarios para ${staffId} el día ${dayName}`);

    // 🔥 TEMPORAL: Retornar datos mock
    const slots = this.mockTimeSlots[staffId]?.[dayName] || [];
    return of(slots);

    // TODO: Implementar llamada real cuando el endpoint esté disponible
    // return this.http.get<any>(`${this.baseUrl}/schedules/staff/${staffId}/slots`, {
    //   headers: this.getHeaders(),
    //   params: { day: dayName }
    // }).pipe(
    //   map(response => response.slots || []),
    //   catchError(error => {
    //     console.error('Error obteniendo horarios:', error);
    //     return of([]);
    //   })
    // );
  }

  /**
   * 🔥 Obtener todos los horarios de un empleado (formato Schedule API)
   * @param staffId ID del empleado
   */
  getStaffSchedules(staffId: string): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.baseUrl}/schedules/staff/${staffId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo horarios:', error);
        return of([]);
      })
    );
  }

  /**
   * 🔥 Crear nuevo horario (formato Schedule API)
   */
  createSchedule(scheduleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/schedules`, scheduleData, {
      headers: this.getHeaders()
    });
  }

  /**
   * 🔥 Actualizar horario existente (formato Schedule API)
   */
  updateSchedule(id: number, scheduleData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/schedules/${id}`, scheduleData, {
      headers: this.getHeaders()
    });
  }

  /**
   * 🔥 Eliminar horario (formato Schedule API)
   */
  deleteSchedule(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/schedules/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * 📌 Obtener horario por defecto (formato DaySchedule)
   */
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
        isOpen: true,
        firstShift: {
          enabled: true,
          start: { hour: 9, minute: 0, ampm: 'AM', display: '9:00 AM' },
          end: { hour: 14, minute: 0, ampm: 'PM', display: '2:00 PM' }
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
}
