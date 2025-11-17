import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

// ✅ Interfaz para el usuario
export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  nombre_completo?: string;
  celular?: string;
  telefono?: string;
  direccion?: string;
  identificacion?: string;
  tipo_identificacion_id?: number;
  estados_id?: number;
  roles_id?: number;
  negocios_id?: number;
  business?: any;
  role?: any;
  status?: any;
}

// 🔥 NUEVA: Interfaz para la suscripción
export interface Subscription {
  id: number;
  plan: any;
  fecha_inicio: string;
  fecha_fin: string;
  dias_restantes: number;
  estado: string;
  notificaciones_usadas: number;
  notificaciones_totales: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  // ✅ BehaviorSubject para emitir cambios del usuario en tiempo real
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ Login actualizado para guardar datos del usuario
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {
      email: email,
      password: password
    }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.saveToken(response.access_token);
        }
        if (response.user) {
          this.saveUser(response.user);
        }
      })
    );
  }

  // Register
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.saveToken(response.access_token);
        }
        if (response.user) {
          this.saveUser(response.user);
        }
      })
    );
  }

  // 🔥 NUEVO: Obtener datos del usuario autenticado + suscripción
  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((response: any) => {
        if (response.user) {
          this.saveUser(response.user);
        }
      })
    );
  }

  // ✅ Guardar usuario en localStorage y emitir cambio
  saveUser(user: User): void {
    // Asegurar que tenga nombre_completo
    if (!user.nombre_completo && user.nombres && user.apellidos) {
      user.nombre_completo = `${user.nombres} ${user.apellidos}`.trim();
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // ✅ Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ✅ Obtener usuario desde localStorage
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ✅ Obtener inicial del nombre
  getUserInitial(): string {
    const user = this.getCurrentUser();
    if (user && user.nombres) {
      return user.nombres.charAt(0).toUpperCase();
    }
    return 'U';
  }

  // ✅ Obtener nombre completo
  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (user) {
      return user.nombre_completo || `${user.nombres} ${user.apellidos}`.trim() || 'Usuario';
    }
    return 'Usuario';
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

  // ✅ Remover token Y usuario
  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // ✅ Logout actualizado
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.removeToken();
      })
    );
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token !== '';
  }

  // 🔥 NUEVO: Obtener negocio_id del usuario autenticado
  getCurrentBusinessId(): number {
    const user = this.getCurrentUser();
    return user?.negocios_id || 1;
  }

  // Métodos de gestión de Business ID (legacy - mantener por compatibilidad)
  setCurrentBusinessId(businessId: number): void {
    localStorage.setItem('currentBusinessId', businessId.toString());
  }

  // Headers con autenticación
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
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
