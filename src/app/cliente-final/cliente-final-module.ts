import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClienteFinalRoutingModule } from './cliente-final-routing.module';
import { FormularioComponent } from './compartido/formulario/formulario.component';
import { ConfirmarCitaComponent } from './confirmar-cita/confirmar-cita.component';
import { Personalizacion } from './personalizacion/personalizacion';

@NgModule({
  imports: [
    CommonModule,
    ClienteFinalRoutingModule,
    // Importar todos los componentes standalone
    Personalizacion,
    FormularioComponent,
    ConfirmarCitaComponent
  ],
  declarations: [
    // No declarar componentes standalone
  ]
})
export class ClienteFinalModule {}
