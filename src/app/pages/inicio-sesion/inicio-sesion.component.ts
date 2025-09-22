// inicio-sesion.component.ts
import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// Servicios temporalmente comentados - crear después
// import { AuthService } from '../../../services/auth.service';
// import { UserService } from '../../../services/user.service';
// import { BusinessService } from '../../../services/business.service';

// Componente modal corregido con las propiedades necesarias
@Component({
  selector: 'app-modal',
  template: `
    <div class="modal" *ngIf="visible">
      <div class="modal-content">
        <span class="close" *ngIf="canClose" (click)="closeModal()">&times;</span>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .modal {
      display: flex;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      position: relative;
    }
    .close {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      color: #aaa;
    }
    .close:hover {
      color: #000;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ModalComponent {
  @Input() visible: boolean = false;
  @Input() canClose: boolean = true;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, RouterModule, ModalComponent],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent implements OnInit, AfterViewInit {
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

    // Simulación temporal de login
    setTimeout(() => {
      this.loadingLogin = false;
      // Simular login exitoso
      localStorage.setItem('token', 'fake-jwt-token');
      this.loginError = '';
      this.router.navigate(['/admin-web']);
    }, 1000);
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

    // Simulación temporal de registro
    setTimeout(() => {
      this.loadingRegister = false;
      this.registroExito = '¡Usuario registrado exitosamente! Ahora registra tu negocio.';
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 200);
    }, 1000);
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

    // Simulación temporal de registro de negocio
    setTimeout(() => {
      this.loadingNegocio = false;
      this.negocioExito = '¡Negocio registrado exitosamente!';
      this.negocioForm.reset();
    }, 1000);
  }

  // Métodos para mostrar errores en el template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('clave'); }
  get registerName() { return this.registroForm.get('nombres'); }
  get registerEmail() { return this.registroForm.get('email'); }
  get registerPassword() { return this.registroForm.get('clave'); }

  // Si el usuario ya está logueado, redirige automáticamente
  ngAfterViewInit() {
    // Función temporal sin servicio de auth
    if (localStorage.getItem('token')) {
      this.router.navigate(['/admin-web']);
    }
  }
}
