import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';


import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-personalizacion',
  imports: [ReactiveFormsModule],
  templateUrl: './personalizacion.html',
  styleUrls: ['./personalizacion.css'],
  encapsulation: ViewEncapsulation.None
})
export class Personalizacion implements OnInit {
  brandingForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.brandingForm = this.fb.group({
      nombre_comercial: [''],
      eslogan: [''],
      descripcion_negocio: [''],
      texto_seguir_redes: [''],
      texto_metodos_pago: [''],
      logo_empresa: [null],
      color_fondo_branding: ['#f8d7da'],
      color_letra_branding: ['#333'],
      facebook_url: [''],
      instagram_url: [''],
      whatsapp_numero: [''],
      acepta_efectivo: [true],
      acepta_tarjeta: [true],
      acepta_nequi: [false],
      acepta_transferencia: [false]
    });

    // Estilos dinámicos para fondo y letra branding y formulario
    const setCssVar = (control: string, cssVar: string) => {
      const ctrl = this.brandingForm.get(control);
      if (ctrl) {
        ctrl.valueChanges.subscribe(value => {
          document.documentElement.style.setProperty(cssVar, value);
        });
      }
    };
    setCssVar('color_fondo_branding', '--color-fondo-branding');
    setCssVar('color_letra_branding', '--color-letra-branding');
    // Aplica también al fondo y letra del formulario
    setCssVar('color_fondo_branding', '--color-fondo-formulario');
    setCssVar('color_letra_branding', '--color-letra-formulario');
  }

  guardar() {
    console.log(this.brandingForm.value);
    // Aquí puedes llamar a tu servicio para guardar la configuración
  }
}
