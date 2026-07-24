import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Account, User, Institution } from '../../services/api.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Cuentas</h2>

    <div class="filters">
      <select [(ngModel)]="filterUserId" (change)="load()">
        <option value="">Todas las personas</option>
        @for (u of users; track u.id) {
          <option [value]="u.id">{{ u.name }}</option>
        }
      </select>
      <select [(ngModel)]="filterType" (change)="load()">
        <option value="">Todos los tipos</option>
        <option value="DEBIT">Débito</option>
        <option value="CREDIT">Crédito</option>
        <option value="INVESTMENT">Inversión</option>
        <option value="CASH">Efectivo</option>
      </select>
    </div>

    <details>
      <summary>Nueva cuenta</summary>
      <div class="form-row">
        <select [(ngModel)]="formUserId">
          <option value="">Persona</option>
          @for (u of users; track u.id) {
            <option [value]="u.id">{{ u.name }}</option>
          }
        </select>
        <select [(ngModel)]="formInstitutionId">
          <option value="">Institución</option>
          @for (inst of institutions; track inst.id) {
            <option [value]="inst.id">{{ inst.name }}</option>
          }
        </select>
        <input [(ngModel)]="formName" placeholder="Nombre de la cuenta" />
        <select [(ngModel)]="formType">
          <option value="DEBIT">Débito</option>
          <option value="CREDIT">Crédito</option>
          <option value="INVESTMENT">Inversión</option>
          <option value="CASH">Efectivo</option>
        </select>
        <button (click)="add()">Crear</button>
      </div>
    </details>

    <table>
      <thead>
        <tr><th>ID</th><th>Nombre</th><th>Persona</th><th>Institución</th><th>Tipo</th><th>Moneda</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (a of accounts; track a.id) {
          <tr>
            <td>{{ a.id }}</td>
            <td>
              @if (editingId === a.id) {
                <input [(ngModel)]="editName" (keyup.enter)="save(a.id)" />
              } @else {
                {{ a.name }}
              }
            </td>
            <td>{{ userName(a.userId) }}</td>
            <td>{{ institutionName(a.institutionId) }}</td>
            <td>{{ a.type }}</td>
            <td>{{ a.currency }}</td>
            <td>
              <button (click)="startEdit(a)">Editar</button>
              <button (click)="remove(a.id)">Eliminar</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    .filters, .form-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    details { margin-bottom: 16px; }
    summary { cursor: pointer; margin-bottom: 8px; font-weight: bold; }
  `]
})
export class AccountsComponent implements OnInit {
  accounts: Account[] = [];
  users: User[] = [];
  institutions: Institution[] = [];

  filterUserId = '';
  filterType = '';

  formUserId = '';
  formInstitutionId = '';
  formName = '';
  formType = 'DEBIT';

  editingId: number | null = null;
  editName = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe(u => this.users = u);
    this.api.getInstitutions().subscribe(i => this.institutions = i);
    this.load();
  }

  load() {
    this.api.getAccounts({
      userId: this.filterUserId ? Number(this.filterUserId) : undefined,
      type: this.filterType || undefined,
    }).subscribe(a => this.accounts = a);
  }

  userName(id: number) { return this.users.find(u => u.id === id)?.name ?? id; }
  institutionName(id: number) { return this.institutions.find(i => i.id === id)?.name ?? id; }

  add() {
    if (!this.formUserId || !this.formInstitutionId || !this.formName.trim()) return;
    this.api.createAccount({
      user_id: Number(this.formUserId),
      institution_id: Number(this.formInstitutionId),
      name: this.formName.trim(),
      type: this.formType,
    }).subscribe(() => {
      this.formName = '';
      this.load();
    });
  }

  startEdit(a: Account) { this.editingId = a.id; this.editName = a.name; }

  save(id: number) {
    this.api.updateAccount(id, { name: this.editName.trim() } as any).subscribe(() => {
      this.editingId = null;
      this.load();
    });
  }

  remove(id: number) {
    if (confirm('¿Eliminar esta cuenta?')) {
      this.api.deleteAccount(id).subscribe(() => this.load());
    }
  }
}
