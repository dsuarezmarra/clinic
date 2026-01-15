import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/inicio',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent),
    canActivate: [authGuard]
  },
  {
    path: 'agenda',
    loadComponent: () => import('./pages/agenda/agenda.component').then(m => m.AgendaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pacientes',
    loadComponent: () => import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pacientes/:id',
    loadComponent: () => import('./pages/paciente-detalle/paciente-detalle.component').then(m => m.PacienteDetalleComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
