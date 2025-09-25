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
// Suponiendo que el header compartido se llama SharedHeaderComponent y está en /compartidos
// import { SharedHeaderComponent } from '../../compartidos/shared-header.component';

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

  constructor(private fb: FormBuilder, private auth: AuthService, private userService: UserService, private businessService: BusinessService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.registroForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      confirmar_clave: ['', [Validators.required, Validators.minLength(6)]],
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
    // Limpiar el mensaje de error antes de cada intento
    this.loginError = '';

    // Marcar todos los campos como tocados para mostrar errores de validación
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
        localStorage.setItem('token', res.access_token);
        this.loginError = '';
        this.router.navigate(['/crear-usuario']);
      },
      error: (err) => {
        this.loadingLogin = false;
        this.loginError = err.error?.message || 'Usuario o contraseña incorrectos.';
        console.log('loginError:', err.error?.message || 'Usuario o contraseña incorrectos.');
      }
    });
  }

  onRegister(): void {
    this.registroError = '';
    this.registroExito = '';

    // Marcar todos los campos como tocados para mostrar errores de validación
    this.registroForm.markAllAsTouched();

    if (this.registroForm.invalid) {
      this.registroError = 'Todos los campos son obligatorios y deben ser válidos.';
      return;
    }

    this.loadingRegister = true;
    this.userService.registerUser(this.registroForm.value).subscribe({
      next: (res) => {
        this.loadingRegister = false;
        this.registroExito = '¡Usuario registrado exitosamente! Ahora registra tu negocio.';
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 200);
      },
      error: (err) => {
        this.loadingRegister = false;
        this.registroError = err.error?.message || 'Error al registrar usuario. Verifica los datos o credenciales.';
      }
    });
  }

  onNegocioSubmit(): void {
    this.negocioError = '';
    this.negocioExito = '';

    // Marcar todos los campos como tocados para mostrar errores de validación
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
        // Mostrar mensaje específico del backend si existe
        if (err.error && typeof err.error === 'object') {
          // Si el backend envía errores por campo, los concatenamos
          const errores = Object.values(err.error).flat().join(' | ');
          this.negocioError = errores || 'Error al registrar negocio.';
        } else {
          this.negocioError = err.error?.message || 'Error al registrar negocio.';
        }
        // Log para depuración
        console.error('Negocio 422 error:', err.error);
      }
    });
  }

  // Métodos para mostrar errores en el template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('clave'); }
  get registerName() { return this.registroForm.get('nombres'); }
  get registerEmail() { return this.registroForm.get('email'); }
  get registerPassword() { return this.registroForm.get('clave'); }

  // Suponiendo que el header compartido se usa en el HTML
  // Comentado: redirección automática que causaba problemas
  ngAfterViewInit() {
    // if (this.auth.isLoggedIn()) {
    //   this.router.navigate(['/crear-usuario']);
    // }
  }
}
