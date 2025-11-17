import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AutoLoginService {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Verificar si el usuario ya está autenticado
   * Si está autenticado, redirigir al dashboard
   */
  checkAutoLogin(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();

      if (user) {
        console.log('✅ Usuario ya autenticado:', user.email);

        // Redirigir según el rol
        this.redirectByRole(user.roles_id);
      }
    }
  }

  /**
   * Redirigir según el rol del usuario
   */
  private redirectByRole(roleId?: number): void {
    switch (roleId) {
      case 1: // Admin
      case 4: // Propietario
        this.router.navigate(['/admin/dashboard']);
        break;
      case 2: // Cliente
        this.router.navigate(['/cliente/mis-citas']);
        break;
      case 3: // Empleado
        this.router.navigate(['/empleado/agenda']);
        break;
      default:
        this.router.navigate(['/admin/dashboard']);
    }
  }

  /**
   * Intentar auto-login si hay token guardado
   */
  tryAutoLogin(): void {
    const token = this.authService.getToken();

    if (token) {
      // Obtener datos del usuario desde el backend
      this.authService.getMe().subscribe({
        next: (response) => {
          console.log('✅ Auto-login exitoso');
          if (response.user) {
            this.redirectByRole(response.user.roles_id);
          }
        },
        error: (error) => {
          console.error('❌ Error en auto-login:', error);
          // Si el token es inválido, limpiar y redirigir al login
          this.authService.removeToken();
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
