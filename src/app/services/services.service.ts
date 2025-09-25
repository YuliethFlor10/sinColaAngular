import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private baseUrl = 'http://127.0.0.1:8000/api/services';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll() { 
    return this.http.get(this.baseUrl, { headers: this.getHeaders() }); 
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
