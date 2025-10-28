import { Component, Input, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service'; // Ajusta esta ruta según tu estructura
import { Subscription } from 'rxjs';

// ✅ Interfaz User local
interface User {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  nombre_completo?: string;
  celular?: string;
  telefono?: string;
  direccion?: string;
  identificacion?: string;
  tipo_identificacion_id?: number;
  estados_id?: number;
  roles_id?: number;
  negocios_id?: number;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;

  // ✅ Datos del usuario
  currentUser: User | null = null;
  userInitial: string = 'U';
  userFullName: string = 'Usuario';

  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // En pantallas de escritorio (más de 1024px), siempre mostrar el sidebar
    if (window.innerWidth > 1024) {
      this.isOpen = true;
    }
  }

  ngOnInit() {
    // Al inicializar, mostrar el sidebar en pantallas de escritorio
    if (window.innerWidth > 1024) {
      this.isOpen = true;
    }

    // ✅ Suscribirse a cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.updateUserDisplay();
    });
  }

  ngOnDestroy() {
    // ✅ Limpiar suscripción
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // ✅ Actualizar datos de visualización del usuario
  private updateUserDisplay(): void {
    if (this.currentUser) {
      // Obtener inicial del primer nombre
      this.userInitial = this.currentUser.nombres
        ? this.currentUser.nombres.charAt(0).toUpperCase()
        : 'U';

      // Obtener nombre completo
      this.userFullName = this.currentUser.nombre_completo
        || `${this.currentUser.nombres} ${this.currentUser.apellidos}`.trim()
        || 'Usuario';
    } else {
      this.userInitial = 'U';
      this.userFullName = 'Usuario';
    }
  }

  toggleSidebar() {
    // Solo permitir toggle en pantallas no de escritorio
    if (window.innerWidth <= 1024) {
      this.isOpen = !this.isOpen;
    }
  }
}
