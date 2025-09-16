import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getAll(resource: string) {
    return this.http.get(`${this.baseUrl}/${resource}`);
  }

  getById(resource: string, id: number | string) {
    return this.http.get(`${this.baseUrl}/${resource}/${id}`);
  }

  create(resource: string, data: any) {
    return this.http.post(`${this.baseUrl}/${resource}`, data);
  }

  update(resource: string, id: number | string, data: any) {
    return this.http.put(`${this.baseUrl}/${resource}/${id}`, data);
  }

  delete(resource: string, id: number | string) {
    return this.http.delete(`${this.baseUrl}/${resource}/${id}`);
  }
}
