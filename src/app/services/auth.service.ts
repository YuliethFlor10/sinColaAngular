import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // Login
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {
      email: email,
      password: password
    });
  }

  // Register
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Login con credenciales por defecto (actualizadas)
  loginWithDefaultCredentials(): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {
      email: 'admin@admin.com',
      password: '12345678'
    });
  }

  // Guardar token
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método setToken para compatibilidad
  setToken(token: string): void {
    this.saveToken(token);
  }

  // Remover token
  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token !== '';
  }

  // Métodos de gestión de Business ID (para personalización)
  getCurrentBusinessId(): number {
    const businessId = localStorage.getItem('currentBusinessId');
    return businessId ? parseInt(businessId) : 1;
  }

  setCurrentBusinessId(businessId: number): void {
    localStorage.setItem('currentBusinessId', businessId.toString());
  }

  // Headers con autenticación
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  // Headers para archivos
  getAuthHeadersForFiles(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }
}
