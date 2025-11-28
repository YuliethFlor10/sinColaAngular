import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CustomizationsService } from '../../services/customizations.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personalizacion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './personalizacion.html',
  styleUrls: ['./personalizacion.css'],
  encapsulation: ViewEncapsulation.None
})
export class Personalizacion implements OnInit {
  brandingForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  logoPreview: string | null = null;

  // 🔥 Corrección obligatoria: NO PUEDE aceptar undefined
  currentCustomizationId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private customizationsService: CustomizationsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupDynamicStyles();
    this.loadExistingCustomization();
  }

  private initializeForm() {
    this.brandingForm = this.fb.group({
      nombre_comercial: ['', [Validators.required, Validators.maxLength(200)]],
      eslogan: ['', [Validators.maxLength(300)]],
      descripcion_negocio: [''],
      facebook_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      instagram_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      whatsapp_numero: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      texto_seguir_redes: ['Síguenos en nuestras redes sociales', [Validators.maxLength(100)]],
      acepta_efectivo: [true],
      acepta_tarjeta: [true],
      acepta_nequi: [false],
      acepta_transferencia: [false],
      texto_metodos_pago: ['Métodos de pago aceptados', [Validators.maxLength(200)]],
      logo_empresa: [null],
      color_fondo_branding: ['#f8d7da'],
      color_letra_branding: ['#333333']
    });
  }

  private setupDynamicStyles() {
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
  }

  private loadExistingCustomization() {
    const businessId = this.authService.getCurrentBusinessId();
    if (!businessId) return;

    this.isLoading = true;

    this.customizationsService.getCustomizationByBusiness(businessId).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response?.data) return;

        const customization = response.data;

        // 🔥 Corrección: asegura que no caiga en undefined
        this.currentCustomizationId = customization.id ?? null;

        this.brandingForm.patchValue({
          nombre_comercial: customization.nombre_comercial || '',
          eslogan: customization.eslogan || '',
          descripcion_negocio: customization.descripcion_negocio || '',
          facebook_url: customization.facebook_url || '',
          instagram_url: customization.instagram_url || '',
          whatsapp_numero: customization.whatsapp_numero || '',
          texto_seguir_redes: customization.texto_seguir_redes || '',
          acepta_efectivo: customization.acepta_efectivo ?? true,
          acepta_tarjeta: customization.acepta_tarjeta ?? true,
          acepta_nequi: customization.acepta_nequi ?? false,
          acepta_transferencia: customization.acepta_transferencia ?? false,
          texto_metodos_pago: customization.texto_metodos_pago || '',
          color_fondo_branding: customization.color_fondo_branding || '#f8d7da',
          color_letra_branding: customization.color_letra_branding || '#333333',
        });

        if (customization.logo_empresa) {
          this.logoPreview = `http://127.0.0.1:8000/storage/${customization.logo_empresa}`;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.brandingForm.patchValue({ logo_empresa: file });

    const reader = new FileReader();
    reader.onload = (e: any) => this.logoPreview = e.target.result;
    reader.readAsDataURL(file);
  }

  guardar() {
    if (this.brandingForm.invalid) {
      this.markTouched();
      this.errorMessage = 'Por favor revisa el formulario.';
      return;
    }

    this.isSaving = true;

    const formData = this.brandingForm.value;
    const businessId = this.authService.getCurrentBusinessId();
    formData.negocios_id = businessId;

    const logoFile = formData.logo_empresa instanceof File ? formData.logo_empresa : null;

    const request$ = this.currentCustomizationId
      ? this.customizationsService.updateCustomization(this.currentCustomizationId, formData, logoFile)
      : this.customizationsService.createCustomization(formData, logoFile);

    request$.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = 'Configuración guardada correctamente.';

        this.currentCustomizationId = response?.data?.id ?? null;

        setTimeout(() => this.router.navigate(['/admin/citas']), 1500);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Error guardando la configuración.';
      }
    });
  }

  private markTouched() {
    Object.values(this.brandingForm.controls).forEach(c => c.markAsTouched());
  }

  omitirPersonalizacion() {
    this.router.navigate(['/admin/citas']);
  }
}
