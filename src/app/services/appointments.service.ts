// appointments.service.ts - ADAPTADO A TU API LARAVEL
import { Injectable } from '@angular/core';
import { Observable, map, catchError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';

// Interfaz que coincide con tu estructura Laravel
export interface LaravelAppointment {
  id?: number;
  created_at?: string;
  updated_at?: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  email: string;
  fecha_nacimiento: string;
  numero_telefono: string;
  tipo_cita: string;
  personal_servicio: string;
  fecha_cita: string;
  hora_cita: string;
  fecha_hora_completa?: string;
  negocios_id?: number;
  nota?: string;
  tiempo_estimado?: number;
  descripcion_cancel?: string;
  fecha_fin?: string;
  user?: any;
  staff?: any;
  business?: any;
  status?: any;
  service?: any;
}

// Interfaz para el componente Angular (mantiene compatibilidad con tu template actual)
export interface Appointment {
  id?: number;
  clientName: string;
  serviceName: string;
  day: number;
  monthName: string;
  time: string;
  status: string;
  nota?: string;
  clientEmail?: string;
  staffName?: string;
  created_at?: string;
  updated_at?: string;
  showMenu?: boolean;
  
  // Campos adicionales de Laravel
  tipo_documento?: string;
  numero_documento?: string;
  fecha_nacimiento?: string;
  numero_telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly apiUrl = 'http://localhost:8000/api/appointments'; // Ajusta tu URL

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Convierte datos de Laravel al formato que usa tu componente Angular
  private mapToUI(laravel: LaravelAppointment): Appointment {
    const date = new Date(laravel.fecha_cita);
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    
    // Determinar estado basado en fechas o campo status si existe
    let status = 'reserved'; // por defecto
    if (laravel.status?.nombre) {
      status = laravel.status.nombre.toLowerCase();
    }
    
    return {
      id: laravel.id,
      clientName: laravel.nombre,
      serviceName: laravel.tipo_cita,
      day: date.getDate(),
      monthName: months[date.getMonth()],
      time: laravel.hora_cita,
      status: status,
      nota: laravel.nota,
      clientEmail: laravel.email,
      staffName: laravel.personal_servicio,
      created_at: laravel.created_at,
      updated_at: laravel.updated_at,
      
      // Campos adicionales
      tipo_documento: laravel.tipo_documento,
      numero_documento: laravel.numero_documento,
      fecha_nacimiento: laravel.fecha_nacimiento,
      numero_telefono: laravel.numero_telefono
    };
  }

  // Convierte datos del componente Angular al formato Laravel
  private mapToLaravel(ui: Partial<Appointment>): Partial<LaravelAppointment> {
    let fechaCita = '';
    
    if (ui.day && ui.monthName) {
      const year = new Date().getFullYear();
      const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                     'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      const month = months.indexOf(ui.monthName) + 1;
      fechaCita = `${year}-${month.toString().padStart(2, '0')}-${ui.day.toString().padStart(2, '0')}`;
    }

    return {
      nombre: ui.clientName,
      email: ui.clientEmail || '',
      tipo_cita: ui.serviceName,
      personal_servicio: ui.staffName || 'Por asignar',
      fecha_cita: fechaCita,
      hora_cita: ui.time,
      nota: ui.nota,
      tipo_documento: ui.tipo_documento || 'CC',
      numero_documento: ui.numero_documento || '',
      fecha_nacimiento: ui.fecha_nacimiento || '',
      numero_telefono: ui.numero_telefono || '',
      negocios_id: 1 // Ajusta según tu lógica de negocio
    };
  }

  getAll(): Observable<Appointment[]> {
    return this.http.get<LaravelAppointment[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('Datos recibidos de Laravel:', response);
        // Laravel puede devolver { data: [...] } o directamente [...]
        const appointments = (response as any).data || response;
        return appointments.map((apt: LaravelAppointment) => this.mapToUI(apt));
      }),
      catchError(error => {
        console.error('Error al obtener citas:', error);
        return of([]);
      })
    );
  }

  getById(id: number | string): Observable<Appointment> {
    return this.http.get<LaravelAppointment>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        const appointment = (response as any).data || response;
        return this.mapToUI(appointment);
      })
    );
  }

  create(appointment: Partial<Appointment>): Observable<Appointment> {
    const payload = this.mapToLaravel(appointment);
    console.log('Enviando a Laravel:', payload);
    
    return this.http.post<LaravelAppointment>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
      map(response => {
        const created = (response as any).data || response;
        return this.mapToUI(created);
      }),
      catchError(error => {
        console.error('Error al crear cita:', error);
        throw error;
      })
    );
  }

  update(id: number | string, appointment: Partial<Appointment>): Observable<Appointment> {
    const payload = this.mapToLaravel(appointment);
    console.log('Actualizando cita:', id, payload);
    
    return this.http.put<LaravelAppointment>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }).pipe(
      map(response => {
        const updated = (response as any).data || response;
        return this.mapToUI(updated);
      }),
      catchError(error => {
        console.error('Error al actualizar cita:', error);
        throw error;
      })
    );
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error al eliminar cita:', error);
        throw error;
      })
    );
  }

  changeStatus(id: number | string, status: string): Observable<Appointment> {
    // Como no veo un campo específico de estado en tu API, 
    // podrías crear un endpoint específico o usar update
    const payload = { status: status };
    
    return this.http.patch<LaravelAppointment>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }).pipe(
      map(response => {
        const updated = (response as any).data || response;
        return this.mapToUI(updated);
      }),
      catchError(error => {
        console.error('Error al cambiar estado:', error);
        // Si falla, intenta con update normal
        return this.update(id, { status });
      })
    );
  }
}