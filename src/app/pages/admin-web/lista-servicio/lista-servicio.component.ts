import { Component } from '@angular/core';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

@Component({
  selector: 'app-lista-servicio',
  templateUrl: './lista-servicio.component.html',
  styleUrls: ['./lista-servicio.component.css'],
  standalone: true,
  imports: [AdminWeb, ContenidoComponent]
})
export class ListaServicioComponent {}
