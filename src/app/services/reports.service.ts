import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  password?: string;
  password_confirmation?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  // URL base de la API - ajusta según tu configuración
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token'); // Ajusta según dónde guardes tu token
    
    if (!token) {
      console.warn('No se encontró token de autenticación');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Obtener todos los usuarios para el dropdown de informes
   * Endpoint: GET /api/users/for-reports
   */
  getUsers(): Observable<ApiResponse<User[]>> {
    const url = `${this.baseUrl}/users/for-reports`;
    return this.http.get<ApiResponse<User[]>>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener un usuario específico por ID
   * Endpoint: GET /api/users/{id}
   */
  getUserById(userId: number): Observable<ApiResponse<User>> {
    const url = `${this.baseUrl}/users/${userId}`;
    return this.http.get<ApiResponse<User>>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crear un nuevo usuario
   * Endpoint: POST /api/users
   */
  createUser(userData: User): Observable<ApiResponse<User>> {
    const url = `${this.baseUrl}/users`;
    return this.http.post<ApiResponse<User>>(url, userData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generar informe para un usuario en un rango de fechas
   * Endpoint: POST /api/reports
   */
  generateReport(userId: number, startDate: string, endDate: string): Observable<any> {
    const url = `${this.baseUrl}/reports`;
    const body = {
      user_id: userId,
      start_date: startDate,
      end_date: endDate
    };

    return this.http.post(url, body, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ReportsService error:', error);

    let message = 'Ocurrió un error en la comunicación con el servidor.';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      message = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        message = 'No se pudo conectar al servidor. Verifique su conexión a internet.';
      } else if (error.status === 401) {
        message = 'No estás autenticado. Por favor, inicia sesión.';
      } else if (error.status === 404) {
        message = 'Recurso no encontrado en el servidor.';
      } else if (error.status === 500) {
        message = 'Error interno del servidor.';
      } else if (error.status === 422) {
        message = 'Datos de entrada inválidos.';
      } else if (error.error && error.error.message) {
        message = error.error.message;
      } else if (error.message) {
        message = error.message;
      }
    }

    return throwError(() => ({ 
      status: error.status, 
      message: message,
      errors: error.error?.errors || null
    }));
  }
}