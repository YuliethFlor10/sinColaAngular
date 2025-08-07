import { Component } from '@angular/core';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

@Component({
  selector: 'app-informe',
  templateUrl: './informe.component.html',
  styleUrls: ['./informe.component.css'],
  standalone: true,
  imports: [AdminWeb, ContenidoComponent]
})
export class InformeComponent {}
