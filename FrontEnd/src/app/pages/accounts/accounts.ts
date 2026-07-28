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
      <select [(ngModel)]="filterUserId" (ngModelChange)="load()">
        <option value="">Todas las personas</option>
        @for (u of users; track u.id) {
          <option [value]="u.id">{{ u.name }}</option>
        }
      </select>
      <select [(ngModel)]="filterType" (ngModelChange)="load()">
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
        <select [(ngModel)]="form.userId">
          <option value="">Persona</option>
          @for (u of users; track u.id) {
            <option [value]="u.id">{{ u.name }}</option>
          }
        </select>
        <select [(ngModel)]="form.institutionId">
          <option value="">Institución</option>
          @for (inst of institutions; track inst.id) {
            <option [value]="inst.id">{{ inst.name }}</option>
          }
        </select>
        <input [(ngModel)]="form.name" placeholder="Nombre de la cuenta" (keyup.enter)="add()" />
        <select [(ngModel)]="form.type">
          <option value="DEBIT">Débito</option>
          <option value="CREDIT">Crédito</option>
          <option value="INVESTMENT">Inversión</option>
          <option value="CASH">Efectivo</option>
        </select>
        <button (click)="add()" [disabled]="!form.userId || !form.institutionId || !form.name.trim()">Crear</button>
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
                <button (click)="save(a.id)">Guardar</button>
                <button (click)="cancelEdit()">Cancelar</button>
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
  editName = '';

  form = { userId: '', institutionId: '', name: '', type: 'DEBIT' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe({
      next: u => this.users = u,
      error: e => console.error('Error al cargar personas', e),
    });
    this.api.getInstitutions().subscribe({
      next: i => this.institutions = i,
      error: e => console.error('Error al cargar instituciones', e),
    });
    this.load();
  }

  load() {
    this.api.getAccounts({
      userId: this.filterUserId ? Number(this.filterUserId) : undefined,
      type: this.filterType || undefined,
    }).subscribe({
      next: a => this.accounts = a,
      error: e => console.error('Error al cargar cuentas', e),
    });
  }

  userName(id: number) { return this.users.find(u => u.id === id)?.name ?? id; }
  institutionName(id: number) { return this.institutions.find(i => i.id === id)?.name ?? id; }

  add() {
    if (!this.form.userId || !this.form.institutionId || !this.form.name.trim()) return;
    this.api.createAccount({
      user_id: Number(this.form.userId),
      institution_id: Number(this.form.institutionId),
      name: this.form.name.trim(),
      type: this.form.type,
    }).subscribe({
      next: () => { this.form.name = ''; this.load(); },
      error: e => console.error('Error al crear cuenta', e),
    });
  }

  startEdit(a: Account) { this.editingId = a.id; this.editName = a.name; }

  save(id: number) {
    if (!this.editName.trim()) return;
    this.api.updateAccount(id, { name: this.editName.trim() }).subscribe({
      next: () => { this.editingId = null; this.load(); },
      error: e => console.error('Error al actualizar cuenta', e),
    });
  }

  cancelEdit() { this.editingId = null; }

  remove(id: number) {
    if (confirm('¿Eliminar esta cuenta?')) {
      this.api.deleteAccount(id).subscribe({
        next: () => this.load(),
        error: e => console.error('Error al eliminar cuenta', e),
      });
    }
  }
}
