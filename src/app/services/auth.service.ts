import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  business?: {
    id: number;
    nombre: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
  };
  role?: {
    id: number;
    nombre: string;
  };
  status?: {
    id: number;
    nombre: string;
  };
}

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
  // 🔥 CORREGIDO: apiUrl ya incluye /api desde environment
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ Login - URL correcta
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

  // 🔥 CORREGIDO: Remover /api duplicado
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

  // 🔥 CORREGIDO: Remover /api duplicado
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

  saveUser(user: User): void {
    if (!user.nombre_completo && user.nombres && user.apellidos) {
      user.nombre_completo = `${user.nombres} ${user.apellidos}`.trim();
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parseando usuario desde localStorage:', e);
        return null;
      }
    }
    return null;
  }

  getUserInitial(): string {
    const user = this.getCurrentUser();
    if (user && user.nombres) {
      return user.nombres.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (user) {
      return user.nombre_completo || `${user.nombres} ${user.apellidos}`.trim() || 'Usuario';
    }
    return 'Usuario';
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    this.saveToken(token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentBusinessId');
    this.currentUserSubject.next(null);
  }

  // 🔥 CORREGIDO: Remover /api duplicado
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.removeToken();
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token !== '';
  }

  getCurrentBusinessId(): number {
    const user = this.getCurrentUser();
    return user?.negocios_id || 1;
  }

  getCurrentBusinessName(): string {
    const user = this.getCurrentUser();
    return user?.business?.nombre || `Negocio ${user?.negocios_id || 1}`;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.roles_id === 1;
  }

  isEmployee(): boolean {
    const user = this.getCurrentUser();
    return user?.roles_id === 3;
  }

  isClient(): boolean {
    const user = this.getCurrentUser();
    return user?.roles_id === 2;
  }

  setCurrentBusinessId(businessId: number): void {
    localStorage.setItem('currentBusinessId', businessId.toString());
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  getAuthHeadersForFiles(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }
}
