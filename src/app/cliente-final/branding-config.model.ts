export interface BrandingConfig {
  id?: number;
  // Información del negocio
  nombre_comercial: string;
  eslogan: string;
  descripcion_negocio: string;

  // Redes sociales
  facebook_url: string;
  instagram_url: string;
  whatsapp_numero: string;
  texto_seguir_redes: string;

  // Métodos de pago
  acepta_efectivo: boolean;
  acepta_tarjeta: boolean;
  acepta_nequi: boolean;
  acepta_transferencia: boolean;
  texto_metodos_pago: string;

  // Archivos y colores
  logo_empresa: string | File | null;
  color_fondo_branding: string;
  color_letra_branding: string;
}
