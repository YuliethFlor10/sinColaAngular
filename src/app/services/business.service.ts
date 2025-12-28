import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private baseUrl = `${environment.apiUrl}/businesses`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * GET /api/businesses - Obtener todos los negocios
   */
  getAll(): Observable<any> {
    return this.http.get(this.baseUrl, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/businesses/{id} - Obtener un negocio por ID
   */
  getById(id: string | number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/register - Registrar negocio (usa endpoint de registro)
   * NOTA: El registro de negocio se hace junto con el usuario en /api/register
   */
  registerBusiness(businessData: any): Observable<any> {
    // 🔥 Este método usa el endpoint de registro que ya existe
   return this.http.post(`${environment.apiUrl}/register`, businessData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PUT /api/businesses/{id} - Actualizar negocio
   */
  update(id: string | number, businessData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, businessData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /api/businesses/{id} - Eliminar negocio
   */
  delete(id: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    console.error('❌ Error HTTP:', error);

    if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.status === 422) {
      if (error.error?.errors) {
        const errors = Object.entries(error.error.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
          .join(' | ');
        errorMessage = `Error de validación: ${errors}`;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
