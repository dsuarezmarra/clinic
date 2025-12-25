import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/inicio',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent)
  },
  {
    path: 'agenda',
    loadComponent: () => import('./pages/agenda/agenda.component').then(m => m.AgendaComponent)
  },
  {
    path: 'pacientes',
    loadComponent: () => import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent)
  },
  {
    path: 'pacientes/:id',
    loadComponent: () => import('./pages/paciente-detalle/paciente-detalle.component').then(m => m.PacienteDetalleComponent)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: '/inicio'
  }
];
