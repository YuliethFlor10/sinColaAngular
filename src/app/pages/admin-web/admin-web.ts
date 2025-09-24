import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../compartido/components/header/header.component';
import { SidebarComponent } from '../../compartido/components/sidebar/sidebar.component';
import { ContenidoComponent } from '../../compartido/components/contenido/contenido.component';

@Component({
  selector: 'app-admin-web',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ContenidoComponent
  ],
  templateUrl: './admin-web.html',
  styleUrl: './admin-web.css',
  standalone: true
})
export class AdminWeb {

}

