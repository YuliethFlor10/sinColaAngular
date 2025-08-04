import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  toggleSidebarClicked() {
    this.toggleSidebar.emit(); // Emite evento para mostrar/ocultar el sidebar
  }
}
