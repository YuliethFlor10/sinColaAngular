import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  login(email: string, clave: string): Observable<{access_token: string, user: any}> {
    return this.http.post<{access_token: string, user: any}>(
      'http://localhost:8000/api/login',
      { email, password: clave }
    ).pipe(
      tap((res) => {
        if (res.access_token) {
          localStorage.setItem('token', res.access_token);
        }
      }),
      catchError(this.handleError)
    );
  }

  register(data: { name: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
        }
      }),
      catchError(this.handleError)
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  private handleError(error: HttpErrorResponse) {
    // Devuelve el error completo para que el componente pueda acceder a error.error.message
    return throwError(() => error);
  }
}
