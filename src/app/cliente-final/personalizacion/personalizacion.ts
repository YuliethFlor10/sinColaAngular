import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CustomizationsService } from '../../services/customizations.service';
import { AuthService } from '../../services/auth.service';
import { BrandingConfig } from '../branding-config.model';

@Component({
  selector: 'app-personalizacion',
  imports: [ReactiveFormsModule],
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

  constructor(
    private fb: FormBuilder,
    private customizationsService: CustomizationsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupDynamicStyles();
    // Comentar la carga automática para evitar interferencias
    // this.loadExistingCustomization();
  }

  private initializeForm() {
    this.brandingForm = this.fb.group({
      // Información del negocio
      nombre_comercial: ['', [Validators.required, Validators.maxLength(200)]],
      eslogan: ['', [Validators.maxLength(300)]],
      descripcion_negocio: [''],

      // Redes sociales
      facebook_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      instagram_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      whatsapp_numero: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      texto_seguir_redes: ['Síguenos en nuestras redes sociales', [Validators.maxLength(100)]],

      // Métodos de pago
      acepta_efectivo: [true],
      acepta_tarjeta: [true],
      acepta_nequi: [false],
      acepta_transferencia: [false],
      texto_metodos_pago: ['Métodos de pago aceptados', [Validators.maxLength(200)]],

      // Archivos y colores
      logo_empresa: [null],
      color_fondo_branding: ['#f8d7da'],
      color_letra_branding: ['#333333']
    });
  }

  private setupDynamicStyles() {
    // Estilos dinámicos para fondo y letra branding
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

    this.isLoading = true;

    // Timeout para evitar que se quede cargando indefinidamente
    const timeout = setTimeout(() => {
      this.isLoading = false;
      console.log('Timeout: No se pudo cargar la configuración, mostrando formulario vacío');
    }, 3000); // 3 segundos de timeout

    this.customizationsService.getCustomizationByBusiness(businessId).subscribe({
      next: (customization) => {
        clearTimeout(timeout);
        this.brandingForm.patchValue(customization);
        this.isLoading = false;
      },
      error: (error) => {
        clearTimeout(timeout);
        console.log('No existe configuración previa o error:', error);
        // No mostrar error, simplemente continuar con formulario vacío
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.brandingForm.patchValue({
        logo_empresa: file
      });
    }
  }

  guardar() {
    if (this.brandingForm.valid) {
      this.isSaving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.brandingForm.value;
      const businessId = this.authService.getCurrentBusinessId();

      // Agregar el businessId a los datos
      formData.negocios_id = businessId;

      // Obtener el archivo de logo si existe
      const logoFile = formData.logo_empresa instanceof File ? formData.logo_empresa : null;

      // Determinar si es creación o actualización
      const customizationId = this.brandingForm.get('id')?.value;

      const operation = customizationId
        ? this.customizationsService.updateCustomization(customizationId, formData, logoFile)
        : this.customizationsService.createCustomization(formData, logoFile);

      operation.subscribe({
        next: (response) => {
          this.isSaving = false;
          this.successMessage = 'Configuración guardada exitosamente';
          this.brandingForm.patchValue({ id: response.data.id});

          // Redirigir a citas después de guardar
          setTimeout(() => {
            this.router.navigate(['/admin/citas']);
          }, 1500);
        },
        error: (error) => {
          this.isSaving = false;
          this.errorMessage = 'Error al guardar la configuración. Por favor, inténtalo de nuevo.';
          console.error('Error saving customization:', error);

          // Limpiar mensaje después de 5 segundos
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }

  omitir() {
    this.router.navigate(['/admin/citas']);
  }

  private markFormGroupTouched() {
    Object.keys(this.brandingForm.controls).forEach(key => {
      const control = this.brandingForm.get(key);
      control?.markAsTouched();
    });
  }

  // Métodos para obtener errores de validación
  getFieldError(fieldName: string): string {
    const field = this.brandingForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} es requerido`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName} excede el máximo de caracteres`;
      }
      if (field.errors['pattern']) {
        return `${fieldName} tiene un formato inválido`;
      }
    }
    return '';
  }
}