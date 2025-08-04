import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive]
})
export class SidebarComponent {
   isOpen: boolean = false; // ← agrega esta línea

  // Puedes agregar métodos para controlarlo si quieres
  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }
}
