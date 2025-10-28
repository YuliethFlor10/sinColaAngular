import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// 📌 Interface simplificada
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
  // 🔥 CONFIGURACIÓN DE LA API
  private apiUrl = 'http://localhost:8000/api/appointments';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    console.log('🚀 AppointmentsService inicializado');
    console.log('📡 API URL:', this.apiUrl);
  }

  /**
   * 📌 Obtener todas las citas
   */
  getAll(): Observable<Appointment[]> {
    console.log('📋 GET /api/appointments');
    
    return this.http.get<any>(this.apiUrl, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Respuesta raw:', response);
        
        let appointments: any[] = [];
        
        if (Array.isArray(response)) {
          appointments = response;
        } else if (response?.data && Array.isArray(response.data)) {
          appointments = response.data;
        } else if (response?.appointments && Array.isArray(response.appointments)) {
          appointments = response.appointments;
        }
        
        console.log('📊 Total citas:', appointments.length);
        return appointments.map(apt => this.mapToFrontend(apt));
      }),
      catchError(error => {
        console.error('❌ Error en getAll:', error);
        return of([]); // Retornar array vacío en caso de error
      })
    );
  }

  /**
   * 📌 Crear nueva cita
   */
  create(appointment: Appointment): Observable<Appointment> {
    const payload = this.buildPayload(appointment);
    
    console.log('➕ POST /api/appointments');
    console.log('📤 Payload completo:', JSON.stringify(payload, null, 2));
    
    return this.http.post<any>(this.apiUrl, payload, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Respuesta de creación:', response);
        const created = response.data || response;
        return this.mapToFrontend(created);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * 📌 Actualizar cita
   */
  update(id: number, appointment: Appointment): Observable<Appointment> {
    const payload = this.buildPayload(appointment);
    
    console.log(`✏️ PUT /api/appointments/${id}`);
    console.log('📤 Payload de actualización:', JSON.stringify(payload, null, 2));
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Respuesta de actualización:', response);
        const updated = response.data || response;
        return this.mapToFrontend(updated);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * 📌 Eliminar cita
   */
  delete(id: number): Observable<void> {
    console.log(`🗑️ DELETE /api/appointments/${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      tap(() => console.log('✅ Cita eliminada')),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * 📌 Cambiar estado de la cita
   */
  changeStatus(id: number, status: string, currentAppointment?: Appointment): Observable<Appointment> {
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
      estados_id: estadosMap[status.toLowerCase()] || 1,
      status: status
    };

    console.log('📤 Payload de cambio de estado:', payload);

    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload, this.httpOptions).pipe(
      map(response => {
        console.log('✅ Estado cambiado:', response);
        const updated = response.data || response;
        return this.mapToFrontend(updated);
      }),
      catchError(error => {
        console.error('❌ Error cambiando estado:', error);
        // Retornar optimista
        return of({
          id: id,
          clientName: currentAppointment?.clientName || 'Cliente',
          serviceName: currentAppointment?.serviceName || 'Servicio',
          day: currentAppointment?.day || 1,
          monthName: currentAppointment?.monthName || 'ENERO',
          time: currentAppointment?.time || '09:00',
          status: status,
          staffName: currentAppointment?.staffName || '',
          nota: currentAppointment?.nota || ''
        });
      })
    );
  }

  /**
   * 📌 Construir payload para el backend
   */
  private buildPayload(appointment: Appointment): any {
    console.log('🔧 Construyendo payload desde:', appointment);
    
    // Construir fecha_cita desde day y monthName
    const year = new Date().getFullYear();
    const months: { [key: string]: string } = {
      'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
      'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
      'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
    };
    
    const monthNum = months[appointment.monthName?.toUpperCase()] || '01';
    const dayNum = String(appointment.day || 1).padStart(2, '0');
    const fecha_cita = `${year}-${monthNum}-${dayNum}`;

    // Mapear status a estados_id
    const estadosMap: { [key: string]: number } = {
      'reserved': 1, 'pendiente': 1,
      'confirmed': 2, 'confirmada': 2,
      'cancelled': 3, 'cancelada': 3,
      'completed': 4, 'completada': 4
    };

    const payload = {
      // Datos del cliente
      nombre: appointment.clientName,
      email: appointment.clientEmail || 'sin-email@ejemplo.com',
      tipo_documento: appointment.clientDocType || 'CC',
      numero_documento: appointment.clientDocNumber || '0000000000',
      fecha_nacimiento: appointment.clientBirthDate || '2000-01-01',
      numero_telefono: appointment.clientPhone || '3000000000',
      
      // Datos de la cita
      tipo_cita: appointment.serviceName,
      personal_servicio: appointment.staffName || 'Sin asignar',
      fecha_cita: fecha_cita,
      hora_cita: appointment.time,
      nota: appointment.nota || '',
      
      // IDs del sistema (valores por defecto)
      negocios_id: 1,
      servicios_id: 1,
      estados_id: estadosMap[appointment.status?.toLowerCase() || 'reserved'] || 1,
      usuarios_id: 1,
      tiempo_estimado: 60
    };

    console.log('✅ Payload construido:', payload);
    return payload;
  }

  /**
   * 📌 Mapear datos del backend al frontend
   */
  private mapToFrontend(apt: any): Appointment {
    if (!apt) {
      console.warn('⚠️ Dato nulo recibido en mapToFrontend');
      return {
        clientName: 'Desconocido',
        serviceName: 'Servicio',
        day: 1,
        monthName: 'ENERO',
        time: '09:00'
      };
    }

    console.log('🔄 Mapeando al frontend:', apt);
    
    // Extraer día y mes de fecha_cita
    let day = 1;
    let monthName = 'ENERO';
    
    if (apt.fecha_cita) {
      try {
        const fecha = new Date(apt.fecha_cita + 'T00:00:00');
        day = fecha.getDate();
        const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                       'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
        monthName = months[fecha.getMonth()];
      } catch (error) {
        console.warn('⚠️ Error parseando fecha:', apt.fecha_cita);
      }
    }

    // Mapear estados_id a status
    const statusMap: { [key: number]: string } = {
      1: 'reserved',
      2: 'confirmed',
      3: 'cancelled',
      4: 'completed'
    };

    const mapped: Appointment = {
      id: apt.id,
      clientName: apt.nombre || apt.clientName || 'Cliente',
      clientEmail: apt.email || apt.clientEmail || '',
      serviceName: apt.tipo_cita || apt.serviceName || 'Servicio',
      staffName: apt.personal_servicio || apt.staffName || '',
      day: day,
      monthName: monthName,
      time: apt.hora_cita || apt.time || '09:00',
      status: statusMap[apt.estados_id] || apt.status || 'reserved',
      nota: apt.nota || '',
      clientDocType: apt.tipo_documento || '',
      clientDocNumber: apt.numero_documento || '',
      clientBirthDate: apt.fecha_nacimiento || '',
      clientPhone: apt.numero_telefono || ''
    };
    
    console.log('✅ Mapeado completo:', mapped);
    return mapped;
  }

  /**
   * 📌 Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    console.error('❌ Error HTTP completo:', error);
    
    if (error.status === 0) {
      errorMessage = '🔴 No se puede conectar con el servidor. ¿Laravel está corriendo en http://localhost:8000?';
    } else if (error.status === 404) {
      errorMessage = '🔴 Endpoint no encontrado (404). Verifica que exista la ruta /api/appointments en Laravel.';
    } else if (error.status === 422) {
      errorMessage = '🔴 Error de validación. Campos faltantes o inválidos.';
      if (error.error?.errors) {
        console.error('Errores de validación:', error.error.errors);
        const firstError = Object.values(error.error.errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage += ` ${firstError[0]}`;
        }
      }
    } else if (error.status === 500) {
      errorMessage = '🔴 Error interno del servidor (500). Revisa los logs de Laravel.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error ${error.status}: ${error.statusText}`;
    }
    
    console.error('💥 Error final:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
