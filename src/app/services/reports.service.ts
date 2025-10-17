import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private baseUrl = '/api'; // Ajustar si la API está en otro host o prefijo

  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  /** Obtener todos los usuarios */
  getUsers(): Observable<any> {
    const url = `${this.baseUrl}/users`;
    return this.http.get(url, { headers: this.jsonHeaders })
      .pipe(
        catchError(this.handleError)
      );
  }

  /** Generar informe para un usuario en un rango de fechas */
  generateReport(userId: number, startDate: string, endDate: string): Observable<any> {
    const url = `${this.baseUrl}/reports`;
    const body = {
      user_id: userId,
      start_date: startDate,
      end_date: endDate
    };

    return this.http.post(url, JSON.stringify(body), { headers: this.jsonHeaders })
      .pipe(
        catchError(this.handleError)
      );
  }

  /** Manejo básico de errores HTTP */
  private handleError(error: HttpErrorResponse) {
    console.error('ReportsService error:', error);

    let message = 'Ocurrió un error en la comunicación con el servidor.';
    if (error.error && typeof error.error === 'string') {
      message = error.error;
    } else if (error.error && error.error.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }

    return throwError(() => ({ status: error.status, message }));
  }
}
