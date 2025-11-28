import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interfaces
interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

interface ReportParams {
  user_id?: number;
  start_date: string;
  end_date: string;
  role?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('auth_token') || 
                localStorage.getItem('token') ||
                sessionStorage.getItem('auth_token') ||
                sessionStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
    }

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Obtener usuarios para el dropdown de informes
   * GET /api/users/for-reports
   */
  getUsers(): Observable<ApiResponse<User[]>> {
    const url = `${this.baseUrl}/users/for-reports`;
    
    console.log('📡 Solicitando usuarios desde:', url);
    
    return this.http.get<ApiResponse<User[]>>(url, { 
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✓ Usuarios obtenidos:', response.data?.length || 0);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * 🔥 MEJORADO: Generar informe completo con TODOS los parámetros
   * POST /api/reports
   */
  generateReport(
    userId: number | null, 
    startDate: string, 
    endDate: string,
    role?: string,
    status?: string
  ): Observable<any> {
    const url = `${this.baseUrl}/reports`;
    
    // 🔥 Construir el body con TODOS los parámetros
    const body: ReportParams = {
      start_date: startDate,
      end_date: endDate
    };

    // Solo agregar user_id si es un número válido mayor que 0
    if (userId !== null && userId > 0) {
      body.user_id = userId;
    }

    // 🔥 CRÍTICO: Normalizar el rol antes de enviarlo
    if (role && role !== 'all') {
      body.role = this.normalizeRole(role);
    }

    // 🔥 Agregar filtro de estado
    if (status && status !== 'all') {
      body.status = status;
    }

    console.log('📡 Generando informe con parámetros:', body);

    return this.http.post(url, body, { 
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✓ Informe generado exitosamente');
        console.log('📊 Datos del informe:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * 🔥 NUEVO: Normalizar roles para enviar al backend
   */
  private normalizeRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'propietario': 'propietario',
      'empleado': 'empleado',
      'administrador': 'administrador',
      'all': 'all'
    };

    const normalized = role.toLowerCase().trim();
    return roleMap[normalized] || role;
  }

  /**
   * Obtener estadísticas rápidas
   * GET /api/reports/stats
   */
  getQuickStats(): Observable<any> {
    const url = `${this.baseUrl}/reports/stats`;
    
    console.log('📡 Solicitando estadísticas rápidas');
    
    return this.http.get(url, { 
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✓ Estadísticas obtenidas');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('auth_token') ||
                  sessionStorage.getItem('token');
    
    return !!token;
  }

  /**
   * Manejo centralizado de errores HTTP con logging detallado
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en ReportsService:', error);

    let userMessage = 'Ocurrió un error en la comunicación con el servidor.';
    let technicalDetails = '';

    if (error.error instanceof ErrorEvent) {
      userMessage = 'Error de conexión. Por favor verifica tu conexión a internet.';
      technicalDetails = error.error.message;
      console.error('🔌 Error de red:', technicalDetails);
      
    } else {
      technicalDetails = `Código: ${error.status}, Mensaje: ${error.message}`;
      
      switch (error.status) {
        case 0:
          userMessage = '❌ No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8000';
          console.error('🔌 Backend no disponible. Asegúrate de que Laravel esté corriendo.');
          break;
          
        case 401:
          userMessage = '🔐 No estás autenticado. Por favor, inicia sesión nuevamente.';
          console.error('🔐 Token inválido o expirado.');
          break;
          
        case 403:
          userMessage = '⛔ No tienes permisos para realizar esta acción.';
          console.error('⛔ Acceso denegado por permisos insuficientes.');
          break;
          
        case 404:
          userMessage = '🔍 El recurso solicitado no fue encontrado.';
          console.error('🔍 Endpoint no encontrado:', error.url);
          break;
          
        case 422:
          userMessage = '📝 Datos de entrada inválidos. Verifica los campos del formulario.';
          if (error.error && error.error.errors) {
            console.error('📝 Errores de validación:', error.error.errors);
            const validationErrors = error.error.errors;
            const errorMessages = Object.values(validationErrors).flat();
            userMessage = errorMessages.join(', ');
          }
          break;
          
        case 500:
          userMessage = '⚠️ Error interno del servidor. Por favor contacta al administrador.';
          console.error('⚠️ Error 500 - Revisa los logs del backend Laravel');
          break;
          
        case 503:
          userMessage = '🔧 El servidor está en mantenimiento. Intenta más tarde.';
          console.error('🔧 Servicio no disponible');
          break;
          
        default:
          if (error.error && error.error.message) {
            userMessage = error.error.message;
          }
          console.error(`❌ Error HTTP ${error.status}:`, error.message);
      }
    }

    console.group('📋 Detalles del Error');
    console.log('URL:', error.url);
    console.log('Status:', error.status);
    console.log('Status Text:', error.statusText);
    console.log('Error Response:', error.error);
    console.log('Headers:', error.headers);
    console.groupEnd();

    if (error.error && typeof error.error === 'object' && error.error.message) {
      userMessage = error.error.message;
    }

    return throwError(() => ({ 
      status: error.status, 
      message: userMessage,
      technicalDetails: technicalDetails,
      errors: error.error?.errors || null,
      originalError: error
    }));
  }
}