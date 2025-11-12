import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private baseUrl = 'http://127.0.0.1:8000/api/users';

  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    const url = params ? `${this.baseUrl}?${new URLSearchParams(params).toString()}` : this.baseUrl;
    return this.http.get(url);
  }

  getById(id: number | string) {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  create(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  update(id: number | string, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number | string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
