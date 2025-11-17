// inicio-sesion.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
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
  loginError: string = '';
  registroError: string = '';
  registroExito: string = '';
  loadingLogin = false;
  loadingRegister = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });

    // 🔥 CORREGIDO: Registro incluye datos del negocio
    this.registroForm = this.fb.group({
      // Datos del usuario
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(8)]],
      confirmar_clave: ['', [Validators.required, Validators.minLength(8)]],
      celular: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      tipo_identificacion_id: [1, Validators.required],
      identificacion: ['', Validators.required],
      terminos_condiciones: [true, Validators.required],

      // 🔥 NUEVO: Datos del negocio
      nombre_negocio: ['', Validators.required],
      nit_negocio: ['', Validators.required],
      tipo_servicio_id: [1, Validators.required],
      telefono_negocio: [''],
      direccion_negocio: ['']
    }, { validators: this.passwordsMatchValidator });
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
        if (res.user) {
          this.auth.saveUser(res.user);
        }
        this.loginError = '';

        // ✅ CORREGIDO: Redirigir a una ruta que SÍ existe
        this.router.navigate(['/admin/citas']);
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

    console.log('📝 Iniciando registro de usuario + negocio...');
    console.log('Datos del formulario:', this.registroForm.value);

    // Validar datos antes de enviar
    if (!this.validateRegistrationData(this.registroForm.value)) {
      console.error('❌ Datos de registro inválidos');
      return;
    }

    this.loadingRegister = true;

    try {
      // 🔥 USAR EL ENDPOINT DE REGISTRO QUE CREA USUARIO + NEGOCIO + SUSCRIPCIÓN
      const response = await this.auth.register(this.registroForm.value).toPromise();

      if (response && response.access_token) {
        console.log('✅ Registro exitoso:', response.user);
        console.log('✅ Negocio creado:', response.business);
        console.log('✅ Suscripción creada:', response.subscription);

        // Guardar token automáticamente
        localStorage.setItem('token', response.access_token);
        this.auth.saveToken(response.access_token);

        // Guardar usuario
        if (response.user) {
          this.auth.saveUser(response.user);
        }

        this.registroExito = '¡Usuario y negocio registrados exitosamente! Redirigiendo...';
        this.loadingRegister = false;

        // ✅ CORREGIDO: Redirigir a una ruta que SÍ existe
        setTimeout(() => {
          this.router.navigate(['/admin/citas']);
        }, 2000);
      } else {
        this.loadingRegister = false;
        this.registroError = 'Error al registrar. No se recibió token de acceso.';
      }
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      console.error('Status:', error.status);
      console.error('Message:', error.error);

      this.loadingRegister = false;

      if (error.status === 422) {
        this.handleValidationErrors(error.error.errors);
      } else {
        this.registroError = error.error?.message || 'Error al registrar. Verifica los datos.';
      }
    }
  }

  private validateRegistrationData(data: any): boolean {
    const required = ['nombres', 'apellidos', 'email', 'clave', 'nombre_negocio', 'nit_negocio'];

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

    const errorMessages: string[] = [];
    for (const field in errors) {
      if (errors.hasOwnProperty(field)) {
        const errorMessage = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
        console.error(`❌ ${field}: ${errorMessage}`);
        errorMessages.push(`${field}: ${errorMessage}`);
      }
    }

    this.registroError = errorMessages.join(' | ');
  }

  // Getters para acceder a los controles del formulario en el template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('clave'); }
  get registerName() { return this.registroForm.get('nombres'); }
  get registerEmail() { return this.registroForm.get('email'); }
  get registerPassword() { return this.registroForm.get('clave'); }
}
