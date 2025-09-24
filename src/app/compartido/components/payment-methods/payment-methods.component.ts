import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'payment-methods',
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.css']
})
export class PaymentMethodsComponent {
  @Input() aceptaEfectivo: boolean = false;
  @Input() aceptaTarjeta: boolean = false;
  @Input() aceptaNequi: boolean = false;
  @Input() aceptaTransferencia: boolean = false;
  @Output() aceptaEfectivoChange = new EventEmitter<boolean>();
  @Output() aceptaTarjetaChange = new EventEmitter<boolean>();
  @Output() aceptaNequiChange = new EventEmitter<boolean>();
  @Output() aceptaTransferenciaChange = new EventEmitter<boolean>();
}
