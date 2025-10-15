import { Component, Input, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive]
})
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = false;

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
  }

  toggleSidebar() {
    // Solo permitir toggle en pantallas no de escritorio
    if (window.innerWidth <= 1024) {
      this.isOpen = !this.isOpen;
    }
  }
}
