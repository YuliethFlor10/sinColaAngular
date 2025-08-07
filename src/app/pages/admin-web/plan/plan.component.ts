import { Component } from '@angular/core';
import { AdminWeb } from "../admin-web";
import { ContenidoComponent } from "../../../compartido/components/contenido/contenido.component";

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css'],
  standalone: true,
  imports: [AdminWeb, ContenidoComponent]
})
export class PlanComponent {}
