import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Personalizacion } from './personalizacion/personalizacion';
import { FormularioComponent } from './compartido/formulario/formulario.component';
import { ConfirmarCitaComponent } from './confirmar-cita/confirmar-cita.component';

const routes: Routes = [
  { path: 'personalizacion', component: Personalizacion },
  { path: 'formulario', component: FormularioComponent },
  {
    path: 'confirmar-cita/:id',
    component: ConfirmarCitaComponent
  },
  { path: '', redirectTo: 'personalizacion', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteFinalRoutingModule {}
