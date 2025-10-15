import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrandingConfig } from '../cliente-final/branding-config.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomizationsService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Obtener personalización por business ID
  getCustomizationByBusiness(businessId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/customizations/business/${businessId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Crear personalización
  createCustomization(customizationData: any, logoFile?: File): Observable<any> {
    const formData = this.createFormData(customizationData, logoFile);
    return this.http.post(`${this.apiUrl}/customizations`, formData, {
      headers: this.authService.getAuthHeadersForFiles()
    });
  }

  // Actualizar personalización
  updateCustomization(id: number, customizationData: any, logoFile?: File): Observable<any> {
    const formData = this.createFormData(customizationData, logoFile);
    return this.http.put(`${this.apiUrl}/customizations/${id}`, formData, {
      headers: this.authService.getAuthHeadersForFiles()
    });
  }

  // Eliminar personalización
  deleteCustomization(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customizations/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Método helper para crear FormData
  private createFormData(customizationData: any, logoFile?: File): FormData {
    const formData = new FormData();

    formData.append('negocios_id', customizationData.negocios_id);
    formData.append('nombre_comercial', customizationData.nombre_comercial || '');
    formData.append('eslogan', customizationData.eslogan || '');
    formData.append('descripcion_negocio', customizationData.descripcion_negocio || '');
    formData.append('facebook_url', customizationData.facebook_url || '');
    formData.append('instagram_url', customizationData.instagram_url || '');
    formData.append('whatsapp_numero', customizationData.whatsapp_numero || '');
    formData.append('texto_seguir_redes', customizationData.texto_seguir_redes || '');
    formData.append('acepta_efectivo', customizationData.acepta_efectivo ? 'true' : 'false');
    formData.append('acepta_tarjeta', customizationData.acepta_tarjeta ? 'true' : 'false');
    formData.append('acepta_nequi', customizationData.acepta_nequi ? 'true' : 'false');
    formData.append('acepta_transferencia', customizationData.acepta_transferencia ? 'true' : 'false');
    formData.append('texto_metodos_pago', customizationData.texto_metodos_pago || '');
    formData.append('color_fondo_branding', customizationData.color_fondo_branding || '#f8d7da');
    formData.append('color_letra_branding', customizationData.color_letra_branding || '#333333');

    if (logoFile) {
      formData.append('logo_empresa', logoFile);
    }

    return formData;
  }
}
