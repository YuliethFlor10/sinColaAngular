import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Appointment {
  id?: number;
  clientName: string;
  clientEmail?: string;
  clientDocType?: string;
  clientDocNumber?: string;
  clientBirthDate?: string;
  clientPhone?: string;
  serviceName: string;
  staffName?: string;
  day: number;
  monthName: string;
  time: string;
  status: 'reserved' | 'confirmed' | 'cancelled';
  nota?: string;
  showMenu?: boolean;
}

export interface AppointmentFormData {
  nombre: string;
  email: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string;
  numero_telefono: string;
  tipo_cita: string;
  personal_servicio: string;
  fecha_cita: string;
  hora_cita: string;
  nota?: string;
  negocios_id?: number;
  servicios_id?: number;
  tiempo_estimado?: number;
}

export interface ApiAppointmentRequest {
  usuarios_id?: number;
  negocios_id: number;
  servicios_id: number;
  personal_servicio: string;
  fecha_cita: string;
  hora_cita: string;
  tiempo_estimado: number;
  nota?: string;
  estados_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🚀 AppointmentsService inicializado');
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
   * 🔥 OBTENER NEGOCIO_ID DEL USUARIO AUTENTICADO
   */
  private getCurrentBusinessId(): number {
    const user = this.authService.getCurrentUser();
    return user?.negocios_id || 1;
  }

  /**
   * 🔥 CREAR CITA DESDE FORMULARIO PÚBLICO
   */
  createFromForm(formData: AppointmentFormData): Observable<any> {
    console.log('➕ POST /api/appointments (desde formulario público)');
    console.log('📤 Datos del formulario:', formData);

    // 🔥 ASEGURAR QUE TENGA negocios_id
    if (!formData.negocios_id) {
      console.error('❌ ERROR: No se proporcionó negocios_id');
      return throwError(() => new Error('Se requiere el ID del negocio'));
    }

    const appointmentData = {
      nombre: formData.nombre,
      email: formData.email,
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento,
      fecha_nacimiento: formData.fecha_nacimiento,
      numero_telefono: formData.numero_telefono,
      tipo_cita: formData.tipo_cita,
      personal_servicio: formData.personal_servicio,
      fecha_cita: formData.fecha_cita,
      hora_cita: formData.hora_cita,
      nota: formData.nota || '',
      negocios_id: formData.negocios_id, // 🔥 CRÍTICO
      servicios_id: formData.servicios_id || 1,
      tiempo_estimado: formData.tiempo_estimado || 60
    };

    console.log('📤 Enviando datos completos:', appointmentData);

    return this.http.post<any>(`${this.baseUrl}/appointments`, appointmentData, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Cita creada exitosamente:', response);
        if (response.email_sent) {
          console.log('✅ Correo enviado correctamente');
        } else if (response.email_error) {
          console.warn('⚠️ Error al enviar correo:', response.email_error);
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * 📋 OBTENER TODAS LAS CITAS (filtradas por negocio automáticamente en backend)
   */
  getAll(): Observable<Appointment[]> {
    console.log('📋 GET /api/appointments');
    return this.http.get<any>(`${this.baseUrl}/appointments`, {
      headers: this.getHeaders()
    }).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map(apt => this.transformApiToFrontend(apt));
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data.map((apt: any) => this.transformApiToFrontend(apt));
        }
        return [];
      }),
      tap((appointments) => {
        console.log(`✅ ${appointments.length} citas cargadas para este negocio`);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * ➕ CREAR CITA DESDE ADMIN (con autenticación)
   */
  create(appointment: Appointment): Observable<any> {
    console.log('➕ POST /api/appointments (desde admin)');

    const apiData: ApiAppointmentRequest = {
      negocios_id: this.getCurrentBusinessId(), // 🔥 OBTENER DEL USUARIO
      servicios_id: 1, // TODO: Obtener del formulario
      personal_servicio: appointment.staffName || '',
      fecha_cita: `2025-${this.getMonthNumber(appointment.monthName)}-${appointment.day.toString().padStart(2, '0')}`,
      hora_cita: appointment.time,
      tiempo_estimado: 60,
      nota: appointment.nota || '',
      estados_id: this.mapStatusToId(appointment.status)
    };

    console.log('📤 Creando cita con datos:', apiData);

    return this.http.post<any>(`${this.baseUrl}/appointments`, apiData, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Cita creada:', response);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * ✏️ ACTUALIZAR CITA
   */
  update(id: number, appointment: Appointment): Observable<any> {
    console.log(`✏️ PUT /api/appointments/${id}`);
    const apiData = this.transformFrontendToApi(appointment);
    return this.http.put<any>(`${this.baseUrl}/appointments/${id}`, apiData, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Cita actualizada:', response);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * 🗑️ ELIMINAR CITA
   */
  delete(id: number): Observable<any> {
    console.log(`🗑️ DELETE /api/appointments/${id}`);
    return this.http.delete<any>(`${this.baseUrl}/appointments/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        console.log('✅ Cita eliminada');
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * ✅ CAMBIAR ESTADO DE CITA
   */
  changeStatus(id: number, status: string): Observable<any> {
    console.log(`✅ PATCH /api/appointments/${id}/status`);
    return this.http.patch<any>(
      `${this.baseUrl}/appointments/${id}/status`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        console.log(`✅ Estado cambiado a: ${status}`);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * ❌ CANCELAR CITA
   */
  cancel(id: number, motivo?: string): Observable<any> {
    console.log(`❌ POST /api/appointments/${id}/cancel`);
    return this.http.post<any>(
      `${this.baseUrl}/appointments/${id}/cancel`,
      { motivo },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        console.log('✅ Cita cancelada');
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * 🔄 TRANSFORMAR DATOS DE API A FRONTEND
   */
  private transformApiToFrontend(apiData: any): Appointment {
    const fecha = apiData.fecha ? new Date(apiData.fecha) : new Date();
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                       'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

    return {
      id: apiData.id,
      clientName: apiData.cliente_nombre || apiData.user?.nombres || 'Sin nombre',
      clientEmail: apiData.cliente_email || apiData.user?.email || '',
      clientDocType: apiData.cliente_tipo_doc || '',
      clientDocNumber: apiData.cliente_num_doc || '',
      clientBirthDate: apiData.cliente_fecha_nac || '',
      clientPhone: apiData.cliente_telefono || '',
      serviceName: apiData.service?.nombre || apiData.tipo_servicio || 'Sin servicio',
      staffName: apiData.personal_asignado || 'Sin personal',
      day: fecha.getDate(),
      monthName: monthNames[fecha.getMonth()],
      time: fecha.toTimeString().substring(0, 5),
      status: this.mapApiStatus(apiData.status?.nombre || apiData.estados_id),
      nota: apiData.nota || ''
    };
  }

  /**
   * 🔄 TRANSFORMAR DATOS DE FRONTEND A API
   */
  private transformFrontendToApi(appointment: Appointment): any {
    return {
      negocios_id: this.getCurrentBusinessId(), // 🔥 SIEMPRE INCLUIR
      servicios_id: 1,
      personal_servicio: appointment.staffName || '',
      fecha_cita: `2025-${this.getMonthNumber(appointment.monthName)}-${appointment.day.toString().padStart(2, '0')}`,
      hora_cita: appointment.time,
      tiempo_estimado: 60,
      nota: appointment.nota || '',
      estados_id: this.mapStatusToId(appointment.status)
    };
  }

  /**
   * 🗺️ MAPEAR ESTADO DE API A FRONTEND
   */
  private mapApiStatus(status: any): 'reserved' | 'confirmed' | 'cancelled' {
    if (typeof status === 'string') {
      const statusMap: { [key: string]: 'reserved' | 'confirmed' | 'cancelled' } = {
        'reservada': 'reserved',
        'reserved': 'reserved',
        'confirmada': 'confirmed',
        'confirmed': 'confirmed',
        'cancelada': 'cancelled',
        'cancelled': 'cancelled'
      };
      return statusMap[status?.toLowerCase()] || 'reserved';
    }

    // Si es un número (estado_id)
    const statusIdMap: { [key: number]: 'reserved' | 'confirmed' | 'cancelled' } = {
      1: 'reserved',
      2: 'confirmed',
      3: 'reserved',
      4: 'confirmed',
      5: 'cancelled'
    };
    return statusIdMap[status] || 'reserved';
  }

  /**
   * 🗺️ MAPEAR ESTADO DE FRONTEND A ID
   */
  private mapStatusToId(status: string): number {
    const statusMap: { [key: string]: number } = {
      'reserved': 3,
      'confirmed': 4,
      'cancelled': 5
    };
    return statusMap[status] || 3;
  }

  /**
   * 📅 OBTENER NÚMERO DE MES
   */
  private getMonthNumber(monthName: string): string {
    const months: { [key: string]: string } = {
      'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
      'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
      'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
    };
    return months[monthName] || '01';
  }

  /**
   * ❌ MANEJO DE ERRORES
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error HTTP:', error);
    console.error('Status:', error.status);
    console.error('Error Body:', error.error);

    let errorMessage = 'Ocurrió un error desconocido';

    if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose.';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado (404). Verifica la URL de la API.';
    } else if (error.status === 422) {
      if (error.error?.errors) {
        const validationErrors = Object.entries(error.error.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join(' | ');
        errorMessage = `Errores de validación: ${validationErrors}`;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    } else if (error.status === 500) {
      errorMessage = `Error interno del servidor (500): ${error.error?.message || 'Error desconocido'}`;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    console.error('Final Error Message:', errorMessage);

    return throwError(() => new Error(errorMessage));
  }
}
