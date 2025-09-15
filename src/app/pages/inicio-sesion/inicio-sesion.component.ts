// inicio-sesion.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent {
  
  constructor(private router: Router) {}

  login(event: Event) {
    event.preventDefault();
    // Por ahora solo navegación visual
    console.log('Login clicked');
    // Puedes agregar lógica aquí más tarde
    // this.router.navigate(['/admin/citas']);
    return false;
  }

  registrar(event: Event) {
    event.preventDefault();
    console.log('Registro clicked');
    // Navegación al componente de crear usuario
    this.router.navigate(['/crear-usuario']);
    return false;
  }

  onForgotPassword() {
    console.log('Olvidé contraseña clicked');
    // Lógica para recuperar contraseña
  }

  onSocialLogin(provider: string) {
    console.log(`${provider} login clicked`);
    // Lógica para login con redes sociales
  }
}