import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private baseUrl = 'http://localhost:8000/api/categories';

  constructor(private http: HttpClient) {}

  getAll() { return this.http.get(this.baseUrl); }
  getById(id: number | string) { return this.http.get(`${this.baseUrl}/${id}`); }
  create(data: any) { return this.http.post(this.baseUrl, data); }
  update(id: number | string, data: any) { return this.http.put(`${this.baseUrl}/${id}`, data); }
  delete(id: number | string) { return this.http.delete(`${this.baseUrl}/${id}`); }
}
