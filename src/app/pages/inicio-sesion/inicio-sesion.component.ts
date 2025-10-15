// inicio-sesion.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { BusinessService } from '../../services/business.service';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, RouterModule, ModalComponent],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent implements OnInit {
  loginForm!: FormGroup;
  registroForm!: FormGroup;
  negocioForm!: FormGroup;
  loginError: string = '';
  registroError: string = '';
  registroExito: string = '';
  negocioError: string = '';
  negocioExito: string = '';
  loadingLogin = false;
  loadingRegister = false;
  loadingNegocio = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private userService: UserService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registroForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(8)]], // Mínimo 8 caracteres
      confirmar_clave: ['', [Validators.required, Validators.minLength(8)]],
      celular: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      tipo_identificacion_id: [1, Validators.required],
      identificacion: ['', Validators.required],
      terminos_condiciones: [true, Validators.required],
      estados_id: [1, Validators.required],
      roles_id: [2, Validators.required],
      negocios_id: [1, Validators.required]
    }, { validators: this.passwordsMatchValidator });

    this.negocioForm = this.fb.group({
      nombre: ['', Validators.required],
      nit: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      tipo_servicio_id: ['', Validators.required],
      estados_id: [1, Validators.required],
      plan_id: [1, Validators.required],
      planes_id: [1]
    });
  }

  passwordsMatchValidator(form: FormGroup) {
    const pass = form.get('clave')?.value;
    const confirm = form.get('confirmar_clave')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onLogin(): void {
    this.loginError = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.loginError = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    this.loadingLogin = true;
    const { email, clave } = this.loginForm.value;

    this.auth.login(email, clave).subscribe({
      next: (res) => {
        this.loadingLogin = false;
        if (res.access_token) {
          localStorage.setItem('token', res.access_token);
          console.log('✅ Login exitoso, token guardado');
        }
        this.loginError = '';
        this.router.navigate(['/crear-usuario']);
      },
      error: (err) => {
        this.loadingLogin = false;
        this.loginError = err.error?.message || 'Usuario o contraseña incorrectos.';
        console.error('Error en login:', err);
      }
    });
  }

  async onRegister(): Promise<void> {
    this.registroError = '';
    this.registroExito = '';
    this.registroForm.markAllAsTouched();

    if (this.registroForm.invalid) {
      this.registroError = 'Todos los campos son obligatorios y deben ser válidos.';
      console.log('Formulario inválido:', this.registroForm.errors);
      return;
    }

    console.log('Iniciando registro de usuario...');
    console.log('Datos del formulario:', this.registroForm.value);

    // Validar datos antes de enviar
    if (!this.validateRegistrationData(this.registroForm.value)) {
      console.error('❌ Datos de registro inválidos');
      return;
    }

    this.loadingRegister = true;

    try {
      const response = await this.userService.register(this.registroForm.value).toPromise();

      if (response && response.access_token) {
        console.log('✅ Registro exitoso:', response.user);

        // Guardar token automáticamente después del registro
        localStorage.setItem('token', response.access_token);
        console.log('✅ Token guardado automáticamente después del registro');

        // También guardar con el método del AuthService si existe
        this.auth.saveToken(response.access_token);

        this.registroExito = '¡Usuario registrado exitosamente! Ahora registra tu negocio.';
        this.loadingRegister = false;

        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 200);
      } else {
        this.loadingRegister = false;
        this.registroError = 'Error al registrar usuario. No se recibió token de acceso.';
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.error);

      this.loadingRegister = false;

      if (error.status === 422) {
        this.handleValidationErrors(error.error.errors);
      } else {
        this.registroError = error.error?.message || 'Error al registrar usuario. Verifica los datos o credenciales.';
      }
    }
  }

  private validateRegistrationData(data: any): boolean {
    const required = ['nombres', 'apellidos', 'email', 'clave'];

    for (const field of required) {
      if (!data[field] || data[field].trim() === '') {
        console.error(`❌ Campo requerido faltante: ${field}`);
        this.registroError = `El campo ${field} es requerido`;
        return false;
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.error('❌ Email inválido');
      this.registroError = 'Email inválido';
      return false;
    }

    // Validar contraseña
    if (data.clave.length < 8) {
      console.error('❌ La contraseña debe tener al menos 8 caracteres');
      this.registroError = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }

    return true;
  }

  private handleValidationErrors(errors: any) {
    console.log('Errores de validación:', errors);

    // Mostrar errores al usuario
    const errorMessages: string[] = [];
    for (const field in errors) {
      if (errors.hasOwnProperty(field)) {
        const errorMessage = errors[field][0];
        console.error(`❌ ${field}: ${errorMessage}`);
        errorMessages.push(`${field}: ${errorMessage}`);
      }
    }

    this.registroError = errorMessages.join(' | ');
  }

  onNegocioSubmit(): void {
    this.negocioError = '';
    this.negocioExito = '';
    this.negocioForm.markAllAsTouched();

    if (this.negocioForm.invalid) {
      this.negocioError = 'Todos los campos son obligatorios y deben ser válidos.';
      return;
    }

    this.loadingNegocio = true;
    this.businessService.registerBusiness(this.negocioForm.value).subscribe({
      next: (res) => {
        this.loadingNegocio = false;
        this.negocioExito = '¡Negocio registrado exitosamente!';
        this.negocioForm.reset();
      },
      error: (err) => {
        this.loadingNegocio = false;
        if (err.error && typeof err.error === 'object') {
          const errores = Object.values(err.error).flat().join(' | ');
          this.negocioError = errores || 'Error al registrar negocio.';
        } else {
          this.negocioError = err.error?.message || 'Error al registrar negocio.';
        }
        console.error('Error al registrar negocio:', err.error);
      }
    });
  }

  // Getters para acceder a los controles del formulario en el template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('clave'); }
  get registerName() { return this.registroForm.get('nombres'); }
  get registerEmail() { return this.registroForm.get('email'); }
  get registerPassword() { return this.registroForm.get('clave'); }

  ngAfterViewInit() {
    // Comentado: redirección automática que causaba problemas
    // if (this.auth.isLoggedIn()) {
    //   this.router.navigate(['/crear-usuario']);
    // }
  }
}
