import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service'; // ✅ Asegúrate de tener este import

export interface User {
  id?: number;
  nombres: string;
  apellidos: string;
  email: string;
  celular?: string | null;  // ✅ Permite null
  telefono?: string | null;  // ✅ Permite null
  direccion?: string | null; // ✅ Permite null
  identificacion?: string;
  tipo_identificacion_id?: number;
  roles_id?: number;
  estados_id?: number;
  negocios_id?: number | null;  // ✅ Permite null
  clave?: string;
  terminos_condiciones?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private baseUrl = 'http://127.0.0.1:8000/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('👥 UsersService inicializado');
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
   * 📋 OBTENER TODOS LOS USUARIOS (filtrados por negocio en backend)
   * Parámetros opcionales: role_id, status_id, search
   */
  getAll(params?: any): Observable<any> {
    console.log('📋 GET /api/users');
    console.log('🏢 Negocio actual:', this.getCurrentBusinessId());

    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(this.baseUrl, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      tap((response: any) => {
        const users = Array.isArray(response) ? response : (response.data || []);
        console.log(`✅ ${users.length} usuarios cargados para este negocio`);
        console.log('📦 Usuarios:', users);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 👥 OBTENER USUARIOS POR ROL (Empleados, Clientes, etc.)
   */
  getUsersByRole(roleId: number): Observable<any> {
    console.log(`👥 GET /api/users?role_id=${roleId}`);
    return this.getAll({ role_id: roleId });
  }

  /**
   * 👷 OBTENER EMPLEADOS DEL NEGOCIO ACTUAL
   */
  getEmployees(): Observable<any> {
    console.log('👷 Obteniendo empleados del negocio');
    // role_id = 3 para Empleados
    return this.getUsersByRole(3);
  }

  /**
   * 👨‍💼 OBTENER ADMINISTRADORES DEL NEGOCIO ACTUAL
   */
  getAdmins(): Observable<any> {
    console.log('👨‍💼 Obteniendo administradores del negocio');
    // role_id = 1 para Administradores
    return this.getUsersByRole(1);
  }

  /**
   * 👤 OBTENER CLIENTES DEL NEGOCIO ACTUAL
   */
  getClients(): Observable<any> {
    console.log('👤 Obteniendo clientes del negocio');
    // role_id = 2 para Clientes
    return this.getUsersByRole(2);
  }
/**
 * 👥 OBTENER STAFF (Empleados + Admins) PARA ASIGNAR A SERVICIOS
 */
getStaffForServices(): Observable<any> {
  console.log('👥 Obteniendo staff para servicios');
  return this.http.get(`${this.baseUrl}/staff/available`, {  // ✅ Cambiar a /staff/available
    headers: this.getHeaders()
  }).pipe(
    tap((response: any) => {
      const staff = Array.isArray(response) ? response : (response.data || []);
      console.log(`✅ ${staff.length} miembros del staff disponibles`);
    }),
    catchError(this.handleError)
  );
}

  /**
   * 🔍 OBTENER USUARIO POR ID
   */
  getById(id: string | number): Observable<any> {
    console.log(`🔍 GET /api/users/${id}`);
    return this.http.get(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Usuario obtenido:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ➕ CREAR NUEVO USUARIO
   */
  create(userData: User): Observable<any> {
    console.log('➕ POST /api/users');

    const payload = {
      ...userData,
      negocios_id: this.getCurrentBusinessId() // 🔥 SINCRONIZADO AUTOMÁTICAMENTE
    };

    console.log('📤 Creando usuario:', payload);

    return this.http.post(this.baseUrl, payload, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Usuario creado exitosamente:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✏️ ACTUALIZAR USUARIO
   */
  update(id: string | number, userData: User): Observable<any> {
    console.log(`✏️ PUT /api/users/${id}`);
    console.log('📤 Actualizando usuario:', userData);

    return this.http.put(`${this.baseUrl}/${id}`, userData, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('✅ Usuario actualizado:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 🗑️ ELIMINAR USUARIO
   */
  delete(id: string | number): Observable<any> {
    console.log(`🗑️ DELETE /api/users/${id}`);

    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        console.log('✅ Usuario eliminado');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 🔄 CAMBIAR ESTADO DE USUARIO
   */
  changeStatus(id: string | number, statusId: number): Observable<any> {
    console.log(`🔄 PATCH /api/users/${id}/status`);

    return this.http.patch(
      `${this.baseUrl}/${id}/status`,
      { estados_id: statusId },
      { headers: this.getHeaders() }
    ).pipe(
      tap((response) => {
        console.log('✅ Estado actualizado:', response);
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

    let errorMessage = 'Error desconocido';

    if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose.';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado (404)';
    } else if (error.status === 422) {
      errorMessage = 'Error de validación:';
      if (error.error?.errors) {
        const errors = Object.entries(error.error.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
          .join(' | ');
        errorMessage += ` ${errors}`;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor (500)';
      if (error.error?.message) {
        errorMessage += `: ${error.error.message}`;
      }
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
