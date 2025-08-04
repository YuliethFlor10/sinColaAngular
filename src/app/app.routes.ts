import { Routes } from '@angular/router';

import { CrearUsuarioComponent } from './pages/crear-usuario/crear-usuario.component';
import { CitasComponent } from './pages/citas/citas.component';
import { HorarioComponent } from './pages/horario/horario.component';
import { InformeComponent } from './pages/informe/informe.component';
import { PlanComponent } from './pages/plan/plan.component';
import { InicioSesionComponent } from './pages/inicio-sesion/inicio-sesion.component';
import { ListaServicioComponent } from './pages/lista-servicio/lista-servicio.component';
import { PaginaInicioComponent } from './pages/pagina-inicio/pagina-inicio.component';
import { AdminWeb } from './pages/admin-web/admin-web';

export const routes: Routes = [
  { path: '', redirectTo: 'pagina-inicio', pathMatch: 'full' },
  { path: 'pagina-inicio', component: PaginaInicioComponent },
  { path: 'crear-usuario', component: CrearUsuarioComponent },
  { path: 'citas', component: CitasComponent },
  { path: 'horario', component: HorarioComponent },
  { path: 'informe', component: InformeComponent },
  { path: 'plan', component: PlanComponent },
  { path: 'inicio-sesion', component: InicioSesionComponent },
  { path: 'lista-servicio', component: ListaServicioComponent },

  // rutas admin web
  {
    path: 'admin',
    component: AdminWeb,
    children:[
     { path: 'citas', component: CitasComponent, data: { title: 'Gestión de citas.'} },
     { path: 'usuarios', component: CrearUsuarioComponent, data: { title: 'Gestión de usuarios.'} },
     { path: 'servicios', component: ListaServicioComponent, data: { title: 'Gestión de servicios.'} },
     { path: '', redirectTo: 'citas', pathMatch: 'full' }
  ]
  },

  { path: '**', redirectTo: 'pagina-inicio' }
];

