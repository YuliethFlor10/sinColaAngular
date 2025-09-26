import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private baseUrl = 'http://127.0.0.1:8000/api/users';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll(params?: any) {
    const url = params ? `${this.baseUrl}?${new URLSearchParams(params).toString()}` : this.baseUrl;
    return this.http.get(url, { headers: this.getHeaders() });
  }
  getById(id: number | string) {
    return this.http.get(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
  create(data: any) {
    return this.http.post(this.baseUrl, data, { headers: this.getHeaders() });
  }
  update(id: number | string, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }
  delete(id: number | string) {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
