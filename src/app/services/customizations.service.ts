import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BrandingConfig } from '../cliente-final/branding-config.model';

interface ApiResponse {
  data: BrandingConfig;
  message?: string;
  status?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CustomizationsService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  private customizationChanges$ = new BehaviorSubject<BrandingConfig | null>(null);
  public customization$ = this.customizationChanges$.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json'
    });
  }

  getCustomizationByBusiness(businessId: number): Observable<ApiResponse> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}/customizations/business/${businessId}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        tap(res => {
          if (res?.data) {
            this.customizationChanges$.next(res.data);
            this.applyBranding(res.data);
          }
        })
      );
  }

  createCustomization(data: any, logoFile?: File): Observable<ApiResponse> {
    const form = this.createFormData(data, logoFile);
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/customizations`, form, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        tap(res => {
          if (res?.data) {
            this.customizationChanges$.next(res.data);
            this.applyBranding(res.data);
          }
        })
      );
  }

  updateCustomization(id: number, data: any, logoFile?: File): Observable<ApiResponse> {
    const form = this.createFormData(data, logoFile);
    form.append('_method', 'PUT');

    return this.http
      .post<ApiResponse>(`${this.apiUrl}/customizations/${id}`, form, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        tap(res => {
          if (res?.data) {
            this.customizationChanges$.next(res.data);
            this.applyBranding(res.data);
          }
        })
      );
  }

  private createFormData(data: any, logoFile?: File): FormData {
    const form = new FormData();

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        form.append(key, data[key]);
      }
    });

    if (logoFile) {
      form.append('logo_empresa', logoFile, logoFile.name);
    }

    return form;
  }

  private applyBranding(config: BrandingConfig) {
    if (config.color_fondo_branding) {
      document.documentElement.style.setProperty('--color-fondo-branding', config.color_fondo_branding);
    }
    if (config.color_letra_branding) {
      document.documentElement.style.setProperty('--color-letra-branding', config.color_letra_branding);
    }
    if (config.logo_empresa) {
      localStorage.setItem('business_logo', `http://127.0.0.1:8000/storage/${config.logo_empresa}`);
    }
  }
}
