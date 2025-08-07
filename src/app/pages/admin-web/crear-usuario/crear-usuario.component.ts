import { Component } from '@angular/core';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css'],
  standalone: true,
  imports: [AdminWeb, ContenidoComponent]
})
export class CrearUsuarioComponent {}
