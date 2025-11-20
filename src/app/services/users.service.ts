import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://127.0.0.1:8000/api/users';
  private baseUrl = 'http://127.0.0.1:8000/api';

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
   * Obtener todos los usuarios
   */
  getAll(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Obtener un usuario por ID
   */
  getById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crear nuevo usuario
   */
  create(userData: any): Observable<any> {
    return this.http.post(this.apiUrl, userData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualizar usuario existente
   */
  update(id: string | number, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, userData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar usuario
   */
  delete(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Cambiar estado del usuario
   */
  changeStatus(id: string | number, statusId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { estados_id: statusId }, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener todos los usuarios con rol de empleado para servicios
   */
  getStaffForServices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/staff/available`, {
      headers: this.getHeaders()
    });
  }

  /**
   * 🔥 NUEVO: Obtener personal (empleados/admin) de un negocio específico
   */
  getStaffByBusiness(businessId: number): Observable<any> {
    console.log(`📡 Obteniendo personal del negocio ${businessId}`);
    return this.http.get(`${this.baseUrl}/businesses/${businessId}/users`, {
      headers: this.getHeaders()
    });
  }
}