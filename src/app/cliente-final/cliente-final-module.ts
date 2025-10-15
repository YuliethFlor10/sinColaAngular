import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteFinalRoutingModule } from './cliente-final-routing.module';
import { ConfirmarCitaComponent } from './confirmar-cita/confirmar-cita.component';
import { FormularioComponent } from './compartido/formulario/formulario.component';
import { Personalizacion } from './personalizacion/personalizacion';

@NgModule({
  declarations: [
    // No declarar componentes standalone aquí
  ],
  imports: [
    CommonModule,
    ClienteFinalRoutingModule,
    // Componentes standalone van en imports
    ConfirmarCitaComponent,
    FormularioComponent,
    Personalizacion
  ]
})
export class ClienteFinalModule {}
