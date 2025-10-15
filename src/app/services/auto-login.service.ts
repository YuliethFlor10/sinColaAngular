import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {

  constructor(private authService: AuthService) {}

  /**
   * Intentar login automático al iniciar la aplicación
   * Esto es útil para desarrollo/testing
   */
  async attemptAutoLogin(): Promise<boolean> {
    try {
      // Si ya hay token, no hacer nada
      if (this.authService.isAuthenticated()) {
        console.log('✅ Ya hay token guardado, usuario autenticado');
        return true;
      }

      console.log('🔄 Intentando login automático...');

      // Intentar login con credenciales por defecto
      const response = await lastValueFrom(this.authService.loginWithDefaultCredentials());

      if (response && response.token) {
        this.authService.setToken(response.token);
        console.log('✅ Login automático exitoso');
        return true;
      } else if (response && response.access_token) {
        // Algunas APIs usan 'access_token' en lugar de 'token'
        this.authService.setToken(response.access_token);
        console.log('✅ Login automático exitoso (access_token)');
        return true;
      } else {
        console.log('⚠️ Login automático falló: respuesta sin token');
        return false;
      }
    } catch (error) {
      console.log('❌ Error en login automático:', error);
      console.log('🔍 Detalles del error:', error);
      return false;
    }
  }

  /**
   * NUEVO: Intentar login con múltiples credenciales
   */
  async attemptMultipleLogins(): Promise<boolean> {
    const credentials = [
      { email: 'admin@admin.com', password: '12345678' }, // Credenciales actualizadas
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'admin@test.com', password: '123456' },
      { email: 'test@test.com', password: 'test' },
      { email: 'user@user.com', password: 'user' }
    ];

    for (const cred of credentials) {
      try {
        console.log(`🔄 Probando credenciales: ${cred.email}`);
        const response = await lastValueFrom(this.authService.login(cred.email, cred.password));

        if (response && (response.token || response.access_token)) {
          const token = response.token || response.access_token;
          this.authService.setToken(token);
          console.log(`✅ Login exitoso con: ${cred.email}`);
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

      const response = await lastValueFrom(this.authService.login(email, password));

      if (response && (response.token || response.access_token)) {
        const token = response.token || response.access_token;
        this.authService.setToken(token);
        console.log('✅ Login manual exitoso');
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
