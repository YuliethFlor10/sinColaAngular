import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Personalizacion } from './personalizacion/personalizacion';
import { FormularioComponent } from './compartido/formulario/formulario.component';

const routes: Routes = [
  { path: 'personalizacion', component: Personalizacion },
  { path: 'formulario', component: FormularioComponent },
  { path: '', redirectTo: 'personalizacion', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteFinalRoutingModule {}
