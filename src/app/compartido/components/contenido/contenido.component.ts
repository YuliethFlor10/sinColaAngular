import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-contenido',
  imports: [
    RouterOutlet,
  ],
  templateUrl: './contenido.component.html',
  styleUrl: './contenido.component.css',
  standalone: true
})
export class ContenidoComponent {
  @Input() title: string = '';
}
