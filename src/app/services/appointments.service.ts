import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CreateAppointmentData {
  usuarios_id: number;
  negocios_id: number;
  servicios_id: number;
  fecha: string;
  fecha_fin: string;
  estados_id: number;
  nota?: string;
  tiempo_estimado?: number;
}

export interface BackendAppointment {
  id: number;
  usuarios_id: number;
  negocios_id: number;
  servicios_id: number;
  estados_id: number;
  fecha: string;
  fecha_fin: string;
  nota?: string;
  tiempo_estimado?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  service?: {
    id: number;
    name: string;
  };
  status?: {
    id: number;
    name: string;
    description: string;
  };
  business?: {
    id: number;
    name: string;
  };
}

export interface MappedAppointment {
  id: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  day: number;
  monthName: string;
  time: string;
  status: 'reserved' | 'confirmed' | 'cancelled';
  fecha: string;
  fecha_fin: string;
  usuarios_id: number;
  negocios_id: number;
  servicios_id: number;
  estados_id: number;
  showMenu?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = 'http://127.0.0.1:8000/api/appointments';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    console.log('AppointmentsService inicializado con URL:', this.apiUrl);
  }

  // MAPEAR DATOS DEL BACKEND A FRONTEND
  private mapAppointment(backendData: BackendAppointment): MappedAppointment {
    console.log('Mapeando cita desde backend:', backendData);

    // Determinar estado
    let status: 'reserved' | 'confirmed' | 'cancelled' = 'reserved';
    if (backendData.estados_id === 2 || backendData.status?.name === 'Confirmada') {
      status = 'confirmed';
    } else if (backendData.estados_id === 3 || backendData.status?.name === 'Cancelada') {
      status = 'cancelled';
    }

    const fechaObj = new Date(backendData.fecha);

    return {
      id: backendData.id,
      clientName: backendData.user?.name || `Usuario ${backendData.usuarios_id}`,
      clientEmail: backendData.user?.email || 'no-email@demo.com',
      serviceName: backendData.service?.name || `Servicio ${backendData.servicios_id}`,
      staffName: backendData.business?.name || 'Staff no asignado',
      day: fechaObj.getDate(),
      monthName: fechaObj.toLocaleDateString('es', { month: 'short' }).toUpperCase(),
      time: fechaObj.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status,
      fecha: backendData.fecha,
      fecha_fin: backendData.fecha_fin,
      usuarios_id: backendData.usuarios_id,
      negocios_id: backendData.negocios_id,
      servicios_id: backendData.servicios_id,
      estados_id: backendData.estados_id,
      showMenu: false
    };
  }

  // OBTENER TODAS LAS CITAS
  getAll(): Observable<MappedAppointment[]> {
    console.log('Obteniendo todas las citas...');
    return this.http.get<any>(this.apiUrl, this.httpOptions).pipe(
      map((response: any) => {
        console.log('Respuesta cruda del backend:', response);

        if (Array.isArray(response)) {
          return response.map((appointment: BackendAppointment) => this.mapAppointment(appointment));
        } else if (response.data && Array.isArray(response.data)) {
          return response.data.map((appointment: BackendAppointment) => this.mapAppointment(appointment));
        }

        return [];
      })
    );
  }

  // OBTENER CITA POR ID
  getById(id: number): Observable<MappedAppointment> {
    console.log('Obteniendo cita por ID:', id);
    return this.http.get<BackendAppointment>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      map((response: BackendAppointment) => this.mapAppointment(response))
    );
  }

  // CREAR NUEVA CITA
  create(data: CreateAppointmentData): Observable<MappedAppointment> {
    console.log('Creando nueva cita:', data);
    return this.http.post<BackendAppointment>(this.apiUrl, data, this.httpOptions).pipe(
      map((response: BackendAppointment) => this.mapAppointment(response))
    );
  }

  // ACTUALIZAR CITA
  update(id: string | number, data: Partial<CreateAppointmentData>): Observable<MappedAppointment> {
    console.log('Actualizando cita:', id, data);
    return this.http.put<BackendAppointment>(`${this.apiUrl}/${id}`, data, this.httpOptions).pipe(
      map((response: BackendAppointment) => this.mapAppointment(response))
    );
  }

  // ELIMINAR CITA
  delete(id: string | number): Observable<any> {
    console.log('Eliminando cita:', id);
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  // CAMBIAR ESTADO DE CITA
  changeStatus(id: string | number, newStatusId: number): Observable<MappedAppointment> {
    console.log('Cambiando estado de cita:', id, 'nuevo estado:', newStatusId);
    return this.update(id, { estados_id: newStatusId });
  }
}
