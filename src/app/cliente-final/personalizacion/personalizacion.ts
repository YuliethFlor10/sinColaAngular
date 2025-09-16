import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SocialLinksComponent } from '../../compartido/components/social-links/social-links.component';
import { PaymentMethodsComponent } from '../../compartido/components/payment-methods/payment-methods.component';
import { BrandingConfig } from '../branding-config.model';

@Component({
  selector: 'app-personalizacion',
  imports: [ReactiveFormsModule, SocialLinksComponent, PaymentMethodsComponent],
  templateUrl: './personalizacion.html',
  styleUrl: './personalizacion.css'
})
export class Personalizacion implements OnInit {
  brandingForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.brandingForm = this.fb.group({
      nombre_comercial: [''],
      eslogan: [''],
      descripcion_negocio: [''],
      color_primario: ['#e91e63'],
      color_secundario: ['#d1477a'],
      color_fondo_izquierdo: ['#f8d7da'],
      color_fondo_derecho: ['#fff'],
      color_texto_principal: ['#333'],
      color_texto_secundario: ['#555'],
      logo_principal: [''],
      logo_pequeno: [''],
      favicon: [''],
      duracion_slot_minutos: [30],
      anticipacion_minima_horas: [1],
      horario_atencion_inicio: ['08:00'],
      horario_atencion_fin: ['18:00'],
      dias_atencion: ['L,M,M,J,V,S'],
      maximo_citas_dia: [10],
      titulo_principal: [''],
      subtitulo_formulario: [''],
      mensaje_bienvenida: [''],
      mensaje_confirmacion: [''],
      texto_seguir_redes: [''],
      facebook_url: [''],
      instagram_url: [''],
      whatsapp_numero: [''],
      mostrar_redes_sociales: [true],
      acepta_efectivo: [true],
      acepta_tarjeta: [true],
      acepta_nequi: [false],
      acepta_transferencia: [false],
      texto_metodos_pago: [''],
      mostrar_precios_publicos: [true],
      requiere_confirmacion_email: [false],
      requiere_confirmacion_telefono: [false],
      permite_cancelacion_cliente: [true],
      horas_limite_cancelacion: [24],
      configuracion_extra: ['']
    });

    // Estilos dinámicos con CSS variables
    const setCssVar = (control: string, cssVar: string) => {
      const ctrl = this.brandingForm.get(control);
      if (ctrl) {
        ctrl.valueChanges.subscribe(color => {
          document.documentElement.style.setProperty(cssVar, color);
        });
      }
    };
    setCssVar('color_primario', '--color-primario');
    setCssVar('color_secundario', '--color-secundario');
    setCssVar('color_fondo_izquierdo', '--color-fondo-izquierdo');
    setCssVar('color_fondo_derecho', '--color-fondo-derecho');
    setCssVar('color_texto_principal', '--color-texto-principal');
    setCssVar('color_texto_secundario', '--color-texto-secundario');
  }

  guardar() {
    console.log(this.brandingForm.value);
    // Aquí puedes llamar a tu servicio para guardar la configuración
  }
}
