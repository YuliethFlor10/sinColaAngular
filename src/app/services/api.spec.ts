import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://127.0.0.1:8000'; // 👈 Aquí apuntas a tu API Laravel

  constructor(private http: HttpClient) {}

  // Ejemplo: obtener todos los productos (suponiendo que tienes una ruta /api/products en Laravel)
  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`);
  }
}
