import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// 📌 Interface para los slots de tiempo
export interface TimeSlot {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  display: string;
}

// 📌 Interface para el horario de un día
export interface DaySchedule {
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

// 📌 Interface para el personal/trabajador
export interface Staff {
  id: string;
  name: string;
  displayName: string;
  schedules?: DaySchedule[];
}

// 📌 Interface para horarios guardados
export interface ScheduleData {
  staffId: string;
  staffName: string;
  schedules: DaySchedule[];
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = 'http://localhost:8000/api/schedules';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  // 🔥 ACTUALIZADO: Lista del personal con los nombres correctos
  private staffListSubject = new BehaviorSubject<Staff[]>([
    { id: 'pepita', name: 'Pepita Perez', displayName: 'Pepita Perez' },
    { id: 'luna', name: 'Luna Lunera', displayName: 'Luna Lunera' },
    { id: 'patricia', name: 'Patricia Fernandez', displayName: 'Patricia Fernandez' }
  ]);

  // 📌 Horarios en memoria (cache local)
  private schedulesCache = new Map<string, DaySchedule[]>();

  public staffList$ = this.staffListSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeDefaultSchedules();
  }

  /**
   * 📌 Obtener lista de personal
   */
  getStaffList(): Staff[] {
    return this.staffListSubject.value;
  }

  /**
   * 📌 Obtener horarios de un trabajador específico
   */
  getScheduleByStaff(staffId: string): Observable<DaySchedule[]> {
    // Primero intenta desde cache
    if (this.schedulesCache.has(staffId)) {
      return of(this.schedulesCache.get(staffId)!);
    }

    // Intenta desde API
    return this.http.get<any>(`${this.apiUrl}/${staffId}`, this.httpOptions)
      .pipe(
        map(response => {
          const schedules = response?.data?.schedules || this.getDefaultSchedule();
          this.schedulesCache.set(staffId, schedules);
          return schedules;
        }),
        catchError(error => {
          console.warn(`No se pudo cargar horario de ${staffId}, usando predeterminado`, error);
          const defaultSchedule = this.getDefaultSchedule();
          this.schedulesCache.set(staffId, defaultSchedule);
          return of(defaultSchedule);
        })
      );
  }

  /**
   * 📌 Guardar horarios de un trabajador
   */
  saveSchedule(staffId: string, schedules: DaySchedule[]): Observable<ScheduleData> {
    const payload: ScheduleData = {
      staffId,
      staffName: this.getStaffName(staffId),
      schedules,
      updatedAt: new Date().toISOString()
    };

    // Actualiza cache local
    this.schedulesCache.set(staffId, schedules);

    // Intenta guardar en API
    return this.http.post<any>(this.apiUrl, payload, this.httpOptions)
      .pipe(
        map(response => response.data || payload),
        catchError(error => {
          console.warn('Error guardando en API, guardado en cache local', error);
          // Aunque falle la API, mantiene el cache local
          return of(payload);
        })
      );
  }

  /**
   * 📌 Verificar si un trabajador está disponible en un día/hora específica
   */
  isStaffAvailable(staffId: string, dayName: string, time: string): Observable<boolean> {
    return this.getScheduleByStaff(staffId).pipe(
      map(schedules => {
        const daySchedule = schedules.find(s => 
          s.name.toLowerCase() === dayName.toLowerCase() || 
          s.id === dayName.toLowerCase()
        );

        if (!daySchedule || !daySchedule.isOpen) {
          return false;
        }

        // Convierte el tiempo a minutos desde medianoche
        const timeMinutes = this.timeToMinutes(time);
        
        // Verifica primer turno
        const firstStart = this.timeSlotToMinutes(daySchedule.firstShift.start);
        const firstEnd = this.timeSlotToMinutes(daySchedule.firstShift.end);
        
        if (timeMinutes >= firstStart && timeMinutes <= firstEnd) {
          return true;
        }

        // Verifica segundo turno si está habilitado
        if (daySchedule.secondShift.enabled) {
          const secondStart = this.timeSlotToMinutes(daySchedule.secondShift.start);
          const secondEnd = this.timeSlotToMinutes(daySchedule.secondShift.end);
          
          if (timeMinutes >= secondStart && timeMinutes <= secondEnd) {
            return true;
          }
        }

        return false;
      })
    );
  }

  /**
   * 📌 Obtener días laborables de un trabajador
   */
  getWorkingDays(staffId: string): Observable<string[]> {
    return this.getScheduleByStaff(staffId).pipe(
      map(schedules => 
        schedules
          .filter(s => s.isOpen)
          .map(s => s.name)
      )
    );
  }

  /**
   * 📌 Obtener horarios disponibles para un día específico
   */
  getAvailableTimeSlotsForDay(staffId: string, dayName: string): Observable<string[]> {
    return this.getScheduleByStaff(staffId).pipe(
      map(schedules => {
        const daySchedule = schedules.find(s => 
          s.name.toLowerCase() === dayName.toLowerCase()
        );

        if (!daySchedule || !daySchedule.isOpen) {
          return [];
        }

        const slots: string[] = [];
        
        // Genera slots del primer turno (cada 30 minutos)
        const firstStart = this.timeSlotToMinutes(daySchedule.firstShift.start);
        const firstEnd = this.timeSlotToMinutes(daySchedule.firstShift.end);
        
        for (let m = firstStart; m < firstEnd; m += 30) {
          slots.push(this.minutesToTimeString(m));
        }

        // Genera slots del segundo turno si está habilitado
        if (daySchedule.secondShift.enabled) {
          const secondStart = this.timeSlotToMinutes(daySchedule.secondShift.start);
          const secondEnd = this.timeSlotToMinutes(daySchedule.secondShift.end);
          
          for (let m = secondStart; m < secondEnd; m += 30) {
            slots.push(this.minutesToTimeString(m));
          }
        }

        return slots;
      })
    );
  }

  /**
   * 📌 Obtener nombre del personal por ID
   */
  private getStaffName(staffId: string): string {
    const staff = this.staffListSubject.value.find(s => s.id === staffId);
    return staff?.name || staffId;
  }

  /**
   * 📌 Convertir TimeSlot a minutos desde medianoche
   */
  private timeSlotToMinutes(slot: TimeSlot): number {
    let hours = slot.hour;
    
    // Ajusta para formato 24 horas
    if (slot.ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (slot.ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + slot.minute;
  }

  /**
   * 📌 Convertir string de tiempo (HH:MM) a minutos
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 📌 Convertir minutos a string de tiempo (HH:MM)
   */
  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 📌 Obtener horario predeterminado (8AM-12PM y 1PM-8PM)
   */
  private getDefaultSchedule(): DaySchedule[] {
    const days = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles', 
      'Jueves', 'Viernes', 'Sábado'
    ];

    return days.map((name, index) => ({
      name,
      id: name.toLowerCase(),
      isOpen: index !== 0, // Domingo cerrado por defecto
      firstShift: {
        start: { hour: 8, minute: 0, ampm: 'AM', display: '8:00 AM' },
        end: { hour: 12, minute: 0, ampm: 'PM', display: '12:00 PM' }
      },
      secondShift: {
        start: { hour: 13, minute: 0, ampm: 'PM', display: '1:00 PM' },
        end: { hour: 20, minute: 0, ampm: 'PM', display: '8:00 PM' },
        enabled: true
      }
    }));
  }

  /**
   * 📌 Inicializar horarios predeterminados en cache
   */
  private initializeDefaultSchedules(): void {
    const staff = this.getStaffList();
    staff.forEach(s => {
      if (!this.schedulesCache.has(s.id)) {
        this.schedulesCache.set(s.id, this.getDefaultSchedule());
      }
    });
  }

  /**
   * 📌 Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error('Error HTTP:', error);
      errorMessage = error.error?.message || error.message || `Error del servidor (${error.status})`;
    }
    
    return throwError(() => ({ message: errorMessage }));
  }
}