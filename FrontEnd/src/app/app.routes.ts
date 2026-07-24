import { Routes } from '@angular/router';
import { PeopleComponent } from './pages/people/people';
import { InstitutionsComponent } from './pages/institutions/institutions';
import { AccountsComponent } from './pages/accounts/accounts';
import { TransactionsComponent } from './pages/transactions/transactions';

export const routes: Routes = [
  { path: '', redirectTo: '/personas', pathMatch: 'full' },
  { path: 'personas', component: PeopleComponent, title: 'Personas' },
  { path: 'instituciones', component: InstitutionsComponent, title: 'Instituciones' },
  { path: 'cuentas', component: AccountsComponent, title: 'Cuentas' },
  { path: 'transacciones', component: TransactionsComponent, title: 'Transacciones' },
];
