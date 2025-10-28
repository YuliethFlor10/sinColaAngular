import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {

  constructor(private authService: AuthService) {}

  /**
   * Intentar login automático al iniciar la aplicación
   */
  async attemptAutoLogin(): Promise<boolean> {
    try {
      // Si ya hay token Y usuario, no hacer nada
      if (this.authService.isAuthenticated() && this.authService.getCurrentUser()) {
        console.log('✅ Ya hay token y usuario guardados');
        return true;
      }

      console.log('🔄 Intentando login automático...');

      // Intentar login con credenciales por defecto
      const response = await lastValueFrom(this.authService.loginWithDefaultCredentials());

      if (response && response.access_token) {
        // ✅ El authService ya guarda token y usuario automáticamente gracias al pipe(tap())
        console.log('✅ Login automático exitoso');
        console.log('👤 Usuario:', this.authService.getCurrentUser());
        return true;
      } else {
        console.log('⚠️ Login automático falló: respuesta sin token');
        return false;
      }
    } catch (error) {
      console.log('❌ Error en login automático:', error);
      return false;
    }
  }

  /**
   * Intentar login con múltiples credenciales
   */
  async attemptMultipleLogins(): Promise<boolean> {
    const credentials = [
      { email: 'admin@admin.com', password: '12345678' },
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'test@test.com', password: 'test' }
    ];

    for (const cred of credentials) {
      try {
        console.log(`🔄 Probando credenciales: ${cred.email}`);
        const response = await lastValueFrom(
          this.authService.login(cred.email, cred.password)
        );

        if (response && response.access_token) {
          console.log(`✅ Login exitoso con: ${cred.email}`);
          console.log('👤 Usuario:', this.authService.getCurrentUser());
          return true;
        }
      } catch (error) {
        console.log(`❌ Falló con: ${cred.email}`);
      }
    }

    console.log('❌ Todas las credenciales fallaron');
    return false;
  }

  /**
   * Login manual con credenciales específicas
   */
  async manualLogin(email: string, password: string): Promise<boolean> {
    try {
      console.log('🔄 Intentando login manual...');

      const response = await lastValueFrom(
        this.authService.login(email, password)
      );

      if (response && response.access_token) {
        console.log('✅ Login manual exitoso');
        console.log('👤 Usuario:', this.authService.getCurrentUser());
        return true;
      } else {
        console.log('⚠️ Login manual falló: respuesta sin token');
        return false;
      }
    } catch (error) {
      console.log('❌ Error en login manual:', error);
      return false;
    }
  }
}
