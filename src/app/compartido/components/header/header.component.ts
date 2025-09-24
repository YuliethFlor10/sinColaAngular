import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [NgIf]
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  showLogoutMenu = false;

  constructor(private router: Router) {}

  toggleSidebarClicked() {
    this.toggleSidebar.emit();
  }

  goToHome() {
    this.router.navigate(['/pagina-inicio']);
  }

  toggleLogoutMenu() {
    this.showLogoutMenu = !this.showLogoutMenu;
  }

  logout() {
    // Aquí puedes agregar lógica real de logout si tienes auth
    this.showLogoutMenu = false;
    this.router.navigate(['/inicio-sesion']);
  }
}
