import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './compartido/components/header/header.component';
import { SidebarComponent } from './compartido/components/sidebar/sidebar.component';
import { NotificationService } from './services/notification.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

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

  async ngOnInit(): Promise<void> {
    // Solicitar permisos de notificación al cargar la app
    this.notificationService.initNotifications();

    // Configurar StatusBar para que se muestre correctamente
    if (Capacitor.isNativePlatform()) {
      try {
        // Estilo Light = texto oscuro (para fondo blanco)
        await StatusBar.setStyle({ style: Style.Light });
        // Fondo blanco para la barra de estado
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        // Mostrar la barra de estado
        await StatusBar.show();
        // Asegurar que la barra de estado no se superponga con el contenido
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (error) {
        console.log('Error configurando StatusBar:', error);
      }
    }
  }
}
