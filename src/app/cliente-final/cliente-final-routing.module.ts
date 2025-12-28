import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'personalizacion',
    loadComponent: () => import('./personalizacion/personalizacion')
      .then(m => m.Personalizacion)
  },
  {
    path: 'formulario',
    loadComponent: () => import('./compartido/formulario/formulario.component')
      .then(m => m.FormularioComponent)
  },
  {
    path: 'datos-personales',
    loadComponent: () => import('./datos-personales/datos-personales')
      .then(m => m.DatosPersonales)
  },
  // 🔥 NUEVAS RUTAS CON PARÁMETRO :id
  {
    path: 'cita-confirmada/:id',
    loadComponent: () => import('./confirmacion-cita/cita-confirmada/cita-confirmada.component')
      .then(m => m.CitaConfirmadaComponent)
  },
  {
    path: 'cita-cancelada/:id',
    loadComponent: () => import('./confirmacion-cita/cita-cancelada/cita-cancelada.component')
      .then(m => m.CitaCanceladaComponent)
  },
  {
    path: '',
    redirectTo: 'personalizacion',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteFinalRoutingModule { }
