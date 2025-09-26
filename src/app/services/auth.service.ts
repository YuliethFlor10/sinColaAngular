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
    // Intentar diferentes credenciales comunes
    const credentials = [
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'admin@test.com', password: '123456' },
      { email: 'test@test.com', password: 'test' }
    ];
    
    // Por ahora, usar la primera credencial
    return this.login(credentials[0].email, credentials[0].password);
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