import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Login básico para obtener token
   * Ajusta estos datos según tu API de Laravel
   */
  login(email: string, password: string): Observable<any> {
    const loginData = {
      email: email,
      password: password
    };

    return this.http.post(`${this.baseUrl}/login`, loginData);
  }

  /**
   * Login con credenciales por defecto para testing
   * Usa estas credenciales o las que tengas en tu base de datos
   */
  loginWithDefaultCredentials(): Observable<any> {
    // Cambia estos valores por los de tu usuario admin en Laravel
    return this.login('admin@example.com', 'password');
  }

  /**
   * Guardar token en localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Verificar si hay token guardado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Alias para isAuthenticated (compatibilidad)
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Logout - remover token
   */
  logout(): void {
    localStorage.removeItem('token');
  }

  /**
   * Obtener headers con autenticación
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}