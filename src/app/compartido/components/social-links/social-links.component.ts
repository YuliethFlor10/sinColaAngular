import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'social-links',
  templateUrl: './social-links.component.html',
  styleUrls: ['./social-links.component.css']
})
export class SocialLinksComponent {
  @Input() facebookUrl: string = '';
  @Input() instagramUrl: string = '';
  @Input() whatsappNumero: string = '';
  @Input() mostrarRedes: boolean = false;
  @Output() facebookUrlChange = new EventEmitter<string>();
  @Output() instagramUrlChange = new EventEmitter<string>();
  @Output() whatsappNumeroChange = new EventEmitter<string>();
  @Output() mostrarRedesChange = new EventEmitter<boolean>();
}
