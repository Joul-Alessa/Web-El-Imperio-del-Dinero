import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Account, User, Institution } from '../../services/api.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Cuentas</h2>

    <div class="filters">
      <select (change)="filterUserId = $any($event.target).value; load()">
        <option value="">Todas las personas</option>
        @for (u of users; track u.id) {
          <option [value]="u.id">{{ u.name }}</option>
        }
      </select>
      <select (change)="filterType = $any($event.target).value; load()">
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
        <select #formUserId>
          <option value="">Persona</option>
          @for (u of users; track u.id) {
            <option [value]="u.id">{{ u.name }}</option>
          }
        </select>
        <select #formInstitutionId>
          <option value="">Institución</option>
          @for (inst of institutions; track inst.id) {
            <option [value]="inst.id">{{ inst.name }}</option>
          }
        </select>
        <input #formName placeholder="Nombre de la cuenta" />
        <select #formType>
          <option value="DEBIT">Débito</option>
          <option value="CREDIT">Crédito</option>
          <option value="INVESTMENT">Inversión</option>
          <option value="CASH">Efectivo</option>
        </select>
        <button (click)="add(formUserId.value, formInstitutionId.value, formName.value, formType.value); formName.value = ''">Crear</button>
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
                <input #editInput [value]="a.name" (keyup.enter)="save(a.id, editInput.value)" />
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
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color); }
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

  editingId: number | null = null;

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

  add(userId: string, institutionId: string, name: string, type: string) {
    if (!userId || !institutionId || !name.trim()) return;
    this.api.createAccount({
      user_id: Number(userId),
      institution_id: Number(institutionId),
      name: name.trim(),
      type,
    }).subscribe(() => this.load());
  }

  startEdit(a: Account) { this.editingId = a.id; }

  save(id: number, name: string) {
    if (!name.trim()) return;
    this.api.updateAccount(id, { name: name.trim() }).subscribe(() => {
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
