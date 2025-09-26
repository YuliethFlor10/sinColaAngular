import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private baseUrl = 'http://localhost:8000/api/users';

  constructor(private http: HttpClient) {}

  // ✅ Obtener todos los usuarios
  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  // ✅ Obtener usuario por ID
  getById(id: number | string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // ❌ Crear nuevo usuario
  create(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  // ❌ Actualizar usuario existente
  update(id: number | string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // ✅ Eliminar usuario
  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
