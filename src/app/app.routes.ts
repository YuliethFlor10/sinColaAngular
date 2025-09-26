import { CrearUsuarioComponent } from './pages/admin-web/crear-usuario/crear-usuario.component';
import { CitasComponent } from './pages/admin-web/citas/citas.component';
import { HorarioComponent } from './pages/admin-web/horario/horario.component';
import { Routes } from '@angular/router';
import { InformeComponent } from './pages/admin-web/informe/informe.component';
import { PlanComponent } from './pages/admin-web/plan/plan.component';
import { InicioSesionComponent } from './pages/inicio-sesion/inicio-sesion.component';
import { ServiciosComponent } from './pages/admin-web/lista-servicio/lista-servicio.component';
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
  { path: 'lista-servicio', component: ServiciosComponent },
  // Ruta eliminada: registra-negocio

  // rutas admin web
  {
    path: 'admin',
    component: AdminWeb,
    children:[
     { path: 'citas', component: CitasComponent, data: { title: 'Gestión de citas.'} },
     { path: 'crear-usuario', component: CrearUsuarioComponent, data: { title: 'Gestión de usuarios.'} },
     { path: 'lista-servicio', component: ServiciosComponent, data: { title: 'Gestión de servicios.'} },
     { path: 'horario', component: HorarioComponent, data: { title: 'Gestión de horarios.'} },
     { path: 'informe', component: InformeComponent, data: { title: 'Generación de informes.'} },
     { path: 'plan', component: PlanComponent, data: { title: 'Gestión de planes.'} },
     { path: '', redirectTo: 'citas', pathMatch: 'full' }
  ]
  },

  {
    path: 'cliente-final',
    loadChildren: () => import('./cliente-final/cliente-final-module').then(m => m.ClienteFinalModule)
  },

];
