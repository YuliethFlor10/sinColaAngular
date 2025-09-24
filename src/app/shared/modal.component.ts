import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content">
        <ng-content></ng-content>
        <button *ngIf="canClose" class="modal-close" (click)="close.emit()">&times;</button>
      </div>
    </div>
  `,
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() visible: boolean = false;
  @Input() canClose: boolean = true;
  @Output() close = new EventEmitter<void>();
}
