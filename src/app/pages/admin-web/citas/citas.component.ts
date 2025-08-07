import { Component } from '@angular/core';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css'],
  standalone: true,
  imports: [AdminWeb, ContenidoComponent]
})
export class CitasComponent {
  sidebarOpen = false;
}
