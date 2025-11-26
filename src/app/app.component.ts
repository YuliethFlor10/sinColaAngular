import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './compartido/components/header/header.component';
import { SidebarComponent } from './compartido/components/sidebar/sidebar.component';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  sidebarOpen = false; // 🔥 Propiedad faltante

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Solicitar permisos de notificación al cargar la app
    this.notificationService.initNotifications();
  }
}
