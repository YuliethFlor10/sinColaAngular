import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Appointment {
  id?: number;
  clientName: string;
  clientEmail?: string;
  serviceName: string;
  staffName?: string;
  day: number;
  monthName: string;
  time: string;
  status?: string;
  nota?: string;
  clientDocType?: string;
  clientDocNumber?: string;
  clientBirthDate?: string;
  clientPhone?: string;
  showMenu?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = 'http://localhost:8000/api/appointments';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    console.log('🚀 AppointmentsService inicializado');
  }

  /**
   * GET /api/appointments
   */
  getAll(): Observable<Appointment[]> {
    console.log('📋 GET /api/appointments');

    return this.http.get<any[]>(this.apiUrl, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Respuesta:', response);
        return response.map(apt => this.mapToFrontend(apt));
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST /api/appointments (MÉTODO ORIGINAL - Usando interface Appointment)
   */
  create(appointment: Appointment): Observable<Appointment> {
    const payload = this.buildPayload(appointment);

    console.log('➕ POST /api/appointments');
    console.log('📤 Payload:', payload);

    return this.http.post<any>(this.apiUrl, payload, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Cita creada:', response);
        return this.mapToFrontend(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST /api/appointments (desde formulario - envía datos directos del backend)
   * Retorna la respuesta completa incluyendo email_sent y email_error
   */
  createFromForm(formData: any): Observable<any> {
    console.log('➕ POST /api/appointments (desde formulario)');
    console.log('📤 Datos del formulario:', formData);

    return this.http.post<any>(this.apiUrl, formData, this.httpOptions).pipe(
      tap(response => {
        console.log('✅ Respuesta completa de la API:', response);

        if (response.email_sent) {
          console.log('📧 Correo enviado exitosamente');
        } else if (response.email_error) {
          console.warn('⚠️ Error al enviar correo:', response.email_error);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PUT /api/appointments/{id}
   */
  update(id: number, appointment: Appointment): Observable<Appointment> {
    const payload = this.buildPayload(appointment);

    console.log(`✏️ PUT /api/appointments/${id}`);
    console.log('📤 Payload:', payload);

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Cita actualizada:', response);
        return this.mapToFrontend(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * DELETE /api/appointments/{id}
   */
  delete(id: number): Observable<void> {
    console.log(`🗑️ DELETE /api/appointments/${id}`);

    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      tap(() => console.log('✅ Cita eliminada')),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PATCH /api/appointments/{id} - Cambiar estado
   */
  changeStatus(id: number, status: string): Observable<Appointment> {
    console.log(`🔄 Cambiando estado de cita ${id} a: ${status}`);

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

    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Estado cambiado:', response);
        return this.mapToFrontend(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST /api/appointments/{id}/confirmar
   */
  confirm(id: number): Observable<Appointment> {
    return this.http.post<any>(`${this.apiUrl}/${id}/confirmar`, {}, this.httpOptions).pipe(
      map(response => this.mapToFrontend(response.data || response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST /api/appointments/{id}/cancelar
   */
  cancel(id: number, motivo?: string): Observable<Appointment> {
    return this.http.post<any>(`${this.apiUrl}/${id}/cancelar`, { motivo }, this.httpOptions).pipe(
      map(response => this.mapToFrontend(response.data || response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * GET /api/appointments/{id}
   */
  getById(id: string | number): Observable<Appointment> {
    console.log(`📖 GET /api/appointments/${id}`);

    return this.http.get<any>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Cita obtenida:', response);
        return this.mapToFrontend(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  private buildPayload(appointment: Appointment): any {
    const year = new Date().getFullYear();
    const months: { [key: string]: string } = {
      'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
      'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
      'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
    };

    const monthNum = months[appointment.monthName?.toUpperCase()] || '01';
    const dayNum = String(appointment.day || 1).padStart(2, '0');
    const fecha_cita = `${year}-${monthNum}-${dayNum}`;

    return {
      nombre: appointment.clientName,
      email: appointment.clientEmail || 'sin-email@ejemplo.com',
      tipo_documento: appointment.clientDocType || 'CC',
      numero_documento: appointment.clientDocNumber || '0000000000',
      fecha_nacimiento: appointment.clientBirthDate || '2000-01-01',
      numero_telefono: appointment.clientPhone || '3000000000',
      tipo_cita: appointment.serviceName,
      personal_servicio: appointment.staffName || 'Sin asignar',
      fecha_cita: fecha_cita,
      hora_cita: appointment.time,
      nota: appointment.nota || '',
      negocios_id: 1,
      servicios_id: 1,
      tiempo_estimado: 60
    };
  }

  private mapToFrontend(apt: any): Appointment {
    if (!apt) {
      return {
        clientName: 'Desconocido',
        serviceName: 'Servicio',
        day: 1,
        monthName: 'ENERO',
        time: '09:00'
      };
    }

    let day = 1;
    let monthName = 'ENERO';
    let time = '09:00';

    if (apt.fecha) {
      try {
        const fecha = new Date(apt.fecha);
        day = fecha.getDate();
        const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                       'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
        monthName = months[fecha.getMonth()];
        time = fecha.toTimeString().substring(0, 5);
      } catch (error) {
        console.warn('⚠️ Error parseando fecha:', apt.fecha);
      }
    }

    const statusMap: { [key: number]: string } = {
      1: 'reserved',
      2: 'confirmed',
      3: 'cancelled',
      4: 'completed'
    };

    return {
      id: apt.id,
      clientName: apt.cliente_nombre || 'Cliente',
      clientEmail: apt.cliente_email || '',
      serviceName: apt.tipo_servicio || apt.service?.nombre || 'Servicio',
      staffName: apt.personal_asignado || '',
      day: day,
      monthName: monthName,
      time: time,
      status: statusMap[apt.estados_id] || apt.status || 'reserved',
      nota: apt.nota || '',
      clientDocType: apt.cliente_tipo_doc || '',
      clientDocNumber: apt.cliente_num_doc || '',
      clientBirthDate: apt.cliente_fecha_nac || '',
      clientPhone: apt.cliente_telefono || ''
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    console.error('❌ Error HTTP:', error);

    if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor. Verifica que Laravel esté corriendo en http://localhost:8000';
    } else if (error.status === 404) {
      errorMessage = 'Endpoint no encontrado (404)';
    } else if (error.status === 422) {
      errorMessage = 'Error de validación';
      if (error.error?.errors) {
        const firstError = Object.values(error.error.errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage += `: ${firstError[0]}`;
        }
      }
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
