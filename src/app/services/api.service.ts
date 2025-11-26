import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl; 

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll(resource: string) {
    return this.http.get(`${this.baseUrl}/${resource}`, { headers: this.getHeaders() });
  }

  getById(resource: string, id: number | string) {
    return this.http.get(`${this.baseUrl}/${resource}/${id}`, { headers: this.getHeaders() });
  }

  create(resource: string, data: any) {
    return this.http.post(`${this.baseUrl}/${resource}`, data, { headers: this.getHeaders() });
  }

  update(resource: string, id: number | string, data: any) {
    return this.http.put(`${this.baseUrl}/${resource}/${id}`, data, { headers: this.getHeaders() });
  }

  delete(resource: string, id: number | string) {
    return this.http.delete(`${this.baseUrl}/${resource}/${id}`, { headers: this.getHeaders() });
  }
}
