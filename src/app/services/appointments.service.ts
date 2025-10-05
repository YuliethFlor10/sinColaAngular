import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// 📌 Interface principal de Appointment
export interface Appointment {
  id?: number;
  
  // Campos del frontend (tu template actual)
  clientName: string;
  clientEmail?: string;
  serviceName: string;
  staffName?: string;
  day: number;
  monthName: string;
  time: string;
  status?: string;
  nota?: string;
  
  // Campos del backend (opcionales para el frontend)
  tipo_documento?: string;
  numero_documento?: string;
  nombre?: string;
  email?: string;
  fecha_nacimiento?: string;
  numero_telefono?: string;
  tipo_cita?: string;
  personal_servicio?: string;
  fecha_cita?: string;
  hora_cita?: string;
  negocios_id?: number;
  servicios_id?: number;
  estados_id?: number;
  usuarios_id?: number;
  tiempo_estimado?: number;
  descripcion_cancel?: string;
  fecha_hora_completa?: string;
  fecha_fin?: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos del template
  showMenu?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  // 🔥 CAMBIA ESTA URL según tu configuración
  private apiUrl = 'http://localhost:8000/api/appointments';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * 📌 Obtener todas las citas
   */
  getAll(): Observable<Appointment[]> {
    return this.http.get<any[]>(this.apiUrl, this.httpOptions)
      .pipe(
        map(appointments => appointments.map(apt => this.mapToFrontend(apt))),
        catchError(this.handleError)
      );
  }

  /**
   * 📌 Obtener una cita por ID
   */
  getById(id: number): Observable<Appointment> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        map(apt => this.mapToFrontend(apt)),
        catchError(this.handleError)
      );
  }

  /**
   * 📌 Crear nueva cita
   */
  create(appointment: Appointment): Observable<Appointment> {
    const payload = this.mapToBackend(appointment);
    return this.http.post<any>(this.apiUrl, payload, this.httpOptions)
      .pipe(
        map(response => this.mapToFrontend(response.data || response)),
        catchError(this.handleError)
      );
  }

  /**
   * 📌 Actualizar cita existente
   */
  update(id: number, appointment: Appointment): Observable<Appointment> {
    const payload = this.mapToBackend(appointment);
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions)
      .pipe(
        map(response => this.mapToFrontend(response.data || response)),
        catchError(this.handleError)
      );
  }

  /**
   * 📌 Eliminar cita
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * 📌 Cambiar estado de la cita
   */
  changeStatus(id: number, status: string): Observable<Appointment> {
    const estadosMap: { [key: string]: number } = {
      'reserved': 1,
      'pendiente': 1,
      'confirmed': 2,
      'confirmada': 2,
      'cancelled': 3,
      'cancelada': 3,
      'completed': 4,
      'completada': 4
    };

    const payload = {
      estados_id: estadosMap[status.toLowerCase()] || 1
    };

    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions)
      .pipe(
        map(response => this.mapToFrontend(response.data || response)),
        catchError(this.handleError)
      );
  }

  /**
   * 📌 Confirmar una cita
   */
  confirm(id: number): Observable<Appointment> {
    return this.changeStatus(id, 'confirmed');
  }

  /**
   * 📌 Cancelar una cita con razón
   */
  cancel(id: number, razon: string): Observable<Appointment> {
    const payload = {
      estados_id: 3,
      descripcion_cancel: razon
    };

    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions)
      .pipe(
        map(response => this.mapToFrontend(response.data || response)),
        catchError(this.handleError)
      );
  }

  /**
   * 📌 Mapear datos del backend al frontend
   */
  private mapToFrontend(apt: any): Appointment {
    // Extrae día y mes de fecha_cita
    let day = 1;
    let monthName = 'ENERO';
    
    if (apt.fecha_cita) {
      const fecha = new Date(apt.fecha_cita + 'T00:00:00');
      day = fecha.getDate();
      const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                     'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
      monthName = months[fecha.getMonth()];
    }

    // Mapea estados_id a status
    const statusMap: { [key: number]: string } = {
      1: 'reserved',
      2: 'confirmed',
      3: 'cancelled',
      4: 'completed'
    };

    return {
      id: apt.id,
      clientName: apt.nombre || apt.clientName || 'Cliente',
      serviceName: apt.tipo_cita || apt.serviceName || 'Servicio',
      day: day,
      monthName: monthName,
      time: apt.hora_cita || apt.time || '09:00',
      status: statusMap[apt.estados_id] || 'reserved',
      nota: apt.nota || '',
      
      // Campos adicionales del backend
      tipo_documento: apt.tipo_documento,
      numero_documento: apt.numero_documento,
      nombre: apt.nombre,
      email: apt.email,
      fecha_nacimiento: apt.fecha_nacimiento,
      numero_telefono: apt.numero_telefono,
      tipo_cita: apt.tipo_cita,
      personal_servicio: apt.personal_servicio,
      fecha_cita: apt.fecha_cita,
      hora_cita: apt.hora_cita,
      negocios_id: apt.negocios_id,
      servicios_id: apt.servicios_id,
      estados_id: apt.estados_id,
      usuarios_id: apt.usuarios_id,
      tiempo_estimado: apt.tiempo_estimado,
      descripcion_cancel: apt.descripcion_cancel,
      fecha_hora_completa: apt.fecha_hora_completa,
      fecha_fin: apt.fecha_fin,
      created_at: apt.created_at,
      updated_at: apt.updated_at
    };
  }

  /**
   * 📌 Mapear datos del frontend al backend
   */
  private mapToBackend(appointment: Appointment): any {
    // Construye fecha_cita desde day y monthName
    const year = new Date().getFullYear();
    const months: { [key: string]: string } = {
      'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
      'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
      'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
    };
    
    const month = months[appointment.monthName?.toUpperCase() || 'ENERO'] || '01';
    const day = String(appointment.day || 1).padStart(2, '0');

    // Mapea status a estados_id
    const estadosMap: { [key: string]: number } = {
      'reserved': 1,
      'pendiente': 1,
      'confirmed': 2,
      'confirmada': 2,
      'cancelled': 3,
      'cancelada': 3,
      'completed': 4,
      'completada': 4
    };

    return {
      clientName: appointment.clientName || 'Cliente',
      clientEmail: appointment.email || 'cliente@ejemplo.com',
      serviceName: appointment.serviceName || 'Servicio',
      day: appointment.day || 1,
      monthName: appointment.monthName || 'ENERO',
      time: appointment.time || '09:00',
      nota: appointment.nota || '',
      staffName: appointment.personal_servicio || 'Por asignar',
      
      // Campos requeridos con valores por defecto
      tipo_documento: appointment.tipo_documento || 'CC',
      numero_documento: appointment.numero_documento || '0000000000',
      fecha_nacimiento: appointment.fecha_nacimiento || '2000-01-01',
      numero_telefono: appointment.numero_telefono || '3000000000',
      negocios_id: appointment.negocios_id || 1,
      
      // Campos opcionales
      servicios_id: appointment.servicios_id,
      estados_id: appointment.estados_id || estadosMap[appointment.status?.toLowerCase() || 'reserved'] || 1
    };
  }

  /**
   * 📌 Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      console.error('Error HTTP:', error);
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error del servidor (${error.status})`;
      }
    }
    
    return throwError(() => ({ message: errorMessage }));
  }
}