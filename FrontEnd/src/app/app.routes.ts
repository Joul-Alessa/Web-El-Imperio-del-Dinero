import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'movimientos',
    loadComponent: () => import('./pages/movimientos.component').then((m) => m.MovimientosComponent),
  },
  {
    path: 'cuentas',
    loadComponent: () => import('./pages/cuentas.component').then((m) => m.CuentasComponent),
  },
  {
    path: 'instrumentos',
    loadComponent: () => import('./pages/instrumentos.component').then((m) => m.InstrumentosComponent),
  },
  {
    path: 'divisas',
    loadComponent: () => import('./pages/divisas.component').then((m) => m.DivisasComponent),
  },
  {
    path: 'instituciones',
    loadComponent: () => import('./pages/instituciones.component').then((m) => m.InstitucionesComponent),
  },
  {
    path: 'personas',
    loadComponent: () => import('./pages/personas.component').then((m) => m.PersonasComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
