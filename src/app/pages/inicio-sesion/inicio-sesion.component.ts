// inicio-sesion.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
// Suponiendo que el header compartido se llama SharedHeaderComponent y está en /compartidos
// import { SharedHeaderComponent } from '../../compartidos/shared-header.component';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loginError: string = '';
  registerError: string = '';
  loadingLogin = false;
  loadingRegister = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(6)]],
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    const pass = form.get('password')?.value;
    const confirm = form.get('password_confirmation')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onLogin(): void {
    this.router.navigate(['/crear-usuario']);
  }

  onRegister(): void {
    this.registerError = '';
    if (this.registerForm.invalid) return;
    this.loadingRegister = true;
    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.loadingRegister = false;
        this.router.navigate(['/crear-usuario']);
      },
      error: (err: string) => {
        this.loadingRegister = false;
        this.registerError = err;
      }
    });
  }

  // Métodos para mostrar errores en el template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('password'); }
  get registerName() { return this.registerForm.get('name'); }
  get registerEmail() { return this.registerForm.get('email'); }
  get registerPassword() { return this.registerForm.get('password'); }
  get registerPasswordConfirmation() { return this.registerForm.get('password_confirmation'); }

  // Suponiendo que el header compartido se usa en el HTML
  // Si el usuario ya está logueado, redirige automáticamente
  ngAfterViewInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/crear-usuario']);
    }
  }
}
