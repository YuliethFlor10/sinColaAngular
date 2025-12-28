import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Service {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion?: number;  // ✅ Opcional
  negocios_id?: number;
  usuarios_asignados?: number[];
  categorias_id?: number;
  estados_id?: number;
}

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private baseUrl = `${environment.apiUrl}/services`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🔧 ServicesService inicializado');
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
    const businessId = user?.negocios_id || 1;
    console.log('🏢 Business ID actual:', businessId);
    return businessId;
  }

  /**
   * 📋 OBTENER TODOS LOS SERVICIOS (filtrados por negocio en backend)
   */
  getAll(): Observable<any> {
    console.log('📋 GET /api/services');
    console.log('🏢 Negocio actual:', this.getCurrentBusinessId());

    return this.http.get(this.baseUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: any) => {
        const services = Array.isArray(response) ? response : (response.data || []);
        console.log(`✅ ${services.length} servicios cargados para este negocio`);
        console.log('📦 Servicios:', services);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 🔍 OBTENER SERVICIO POR ID
   */
  getById(id: number | string): Observable<any> {
    console.log(`🔍 GET /api/services/${id}`);
    return this.http.get(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Servicio obtenido:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ➕ CREAR NUEVO SERVICIO
   */
  create(data: Service): Observable<any> {
    console.log('➕ POST /api/services');

    const payload = {
      ...data,
      negocios_id: this.getCurrentBusinessId() // 🔥 SINCRONIZADO AUTOMÁTICAMENTE
    };

    console.log('📤 Creando servicio:', payload);

    return this.http.post(this.baseUrl, payload, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Servicio creado exitosamente:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✏️ ACTUALIZAR SERVICIO
   */
  update(id: number | string, data: Service): Observable<any> {
    console.log(`✏️ PUT /api/services/${id}`);
    console.log('📤 Actualizando servicio:', data);

    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Servicio actualizado:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 🗑️ ELIMINAR SERVICIO
   */
  delete(id: number | string): Observable<any> {
    console.log(`🗑️ DELETE /api/services/${id}`);

    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        console.log('✅ Servicio eliminado');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 👥 ASIGNAR EMPLEADOS A UN SERVICIO
   */
  assignStaff(serviceId: number, userIds: number[]): Observable<any> {
    console.log(`👥 POST /api/services/${serviceId}/assign-staff`);
    console.log('📤 Asignando empleados:', userIds);

    return this.http.post(
      `${this.baseUrl}/${serviceId}/assign-staff`,
      { usuarios_ids: userIds },
      { headers: this.getHeaders() }
    ).pipe(
      tap((response) => {
        console.log('✅ Empleados asignados:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 👥 OBTENER EMPLEADOS ASIGNADOS A UN SERVICIO
   */
  getAssignedStaff(serviceId: number): Observable<any> {
    console.log(`👥 GET /api/services/${serviceId}/assigned-staff`);

    return this.http.get(
      `${this.baseUrl}/${serviceId}/assigned-staff`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response) => {
        console.log('✅ Empleados del servicio:', response);
      }),
      catchError(this.handleError)
    );
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
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado (404)';
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
