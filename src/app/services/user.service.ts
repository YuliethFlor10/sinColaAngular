import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
private baseUrl = environment.apiUrl; // 🔥 CAMBIAR
private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Método principal de registro (con formato completo)
  register(userData: any): Observable<any> {
    console.log('Registrando usuario con', this.apiUrl + '/register:', userData);

    // Asegurar que los datos tienen el formato correcto - MANTENER clave, NO cambiar a password
    const formattedData = {
      nombres: userData.nombres || userData.firstName || '',
      apellidos: userData.apellidos || userData.lastName || '',
      email: userData.email || '',
      clave: userData.clave || userData.password || '', // MANTENER como 'clave'
      celular: userData.celular || userData.phone || '',
      telefono: userData.telefono || userData.celular || userData.phone || '',
      direccion: userData.direccion || userData.address || '',
      identificacion: userData.identificacion || userData.docNumber || '',
      tipo_identificacion_id: userData.tipo_identificacion_id || 1,
      roles_id: userData.roles_id || userData.roleId || 2, // Cliente por defecto
      estados_id: userData.estados_id || 1,
      negocios_id: userData.negocios_id || userData.businessId || null // 🔥 Puede ser null
    };

    console.log('Datos formateados:', formattedData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/register`, formattedData, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  // Método alternativo de registro (simplificado)
  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en registerUser:', error);
          return throwError(() => error);
        })
      );
  }

  // Método de login
  login(credentials: { email: string; password: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/login`, credentials, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  // 🔥 CORREGIDO: Obtener usuario actual (usa /me en lugar de /user)
  getCurrentUser(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/me`, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener usuario:', error);
          return throwError(() => error);
        })
      );
  }

  // Logout
  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en logout:', error);
          return throwError(() => error);
        })
      );
  }
}
