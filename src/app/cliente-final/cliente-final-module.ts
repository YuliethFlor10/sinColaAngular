import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteFinalRoutingModule } from './cliente-final-routing.module';
import { ConfirmarCitaComponent } from './confirmar-cita/confirmar-cita.component';

@NgModule({
  declarations: [],  // Componentes standalone NO van aquí
  imports: [
    CommonModule,
    ClienteFinalRoutingModule,
    ConfirmarCitaComponent  // Componentes standalone van en imports
  ]
})
export class ClienteFinalModule {}
