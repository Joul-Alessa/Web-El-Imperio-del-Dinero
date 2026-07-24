import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Account, User, Category, Transaction } from '../../services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Transacciones</h2>

    <details>
      <summary>Nueva transacción</summary>
      <div class="form-card">
        <div class="form-row">
          <select [(ngModel)]="form.accountId">
            <option value="">Cuenta origen</option>
            @for (a of accounts; track a.id) {
              <option [value]="a.id">{{ accountLabel(a) }}</option>
            }
          </select>
          <select [(ngModel)]="form.type" (change)="onTypeChange()">
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE">Gasto</option>
            <option value="TRANSFER">Transferencia</option>
          </select>
          <select [(ngModel)]="form.categoryId">
            <option value="">Categoría</option>
            @for (c of filteredCategories; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>
        <div class="form-row">
          <input type="number" [(ngModel)]="form.amount" placeholder="Monto" />
          <input type="date" [(ngModel)]="form.date" />
          <input [(ngModel)]="form.description" placeholder="Descripción (opcional)" />
        </div>
        @if (form.type === 'TRANSFER') {
          <div class="form-row">
            <select [(ngModel)]="form.destinationAccountId">
              <option value="">Cuenta destino</option>
              @for (a of accounts; track a.id) {
                @if (a.id !== form.accountId) {
                  <option [value]="a.id">{{ accountLabel(a) }}</option>
                }
              }
            </select>
          </div>
        }
        <button (click)="addTransaction()">Guardar</button>
      </div>
    </details>

    <div class="filters">
      <select [(ngModel)]="filterAccountId" (change)="load()">
        <option value="">Todas las cuentas</option>
        @for (a of accounts; track a.id) {
          <option [value]="a.id">{{ accountLabel(a) }}</option>
        }
      </select>
      <input type="date" [(ngModel)]="filterFrom" (change)="load()" placeholder="Desde" />
      <input type="date" [(ngModel)]="filterTo" (change)="load()" placeholder="Hasta" />
    </div>

    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Descripción</th><th>Monto</th><th>Categoría</th><th></th>
        </tr>
      </thead>
      <tbody>
        @for (tx of transactions; track tx.id) {
          <tr>
            <td>{{ tx.date }}</td>
            <td>{{ tx.description || '-' }}</td>
            <td [class.positive]="tx.amount > 0" [class.negative]="tx.amount < 0">
              {{ tx.amount | number:'1.2-2' }}
            </td>
            <td>{{ categoryName(tx.categoryId) }}</td>
            <td><button (click)="remove(tx.id)">Eliminar</button></td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    .form-card { border: 1px solid #ddd; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
    .form-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    .positive { color: green; font-weight: bold; }
    .negative { color: red; font-weight: bold; }
    details { margin-bottom: 16px; }
    summary { cursor: pointer; margin-bottom: 8px; font-weight: bold; }
  `]
})
export class TransactionsComponent implements OnInit {
  accounts: Account[] = [];
  users: User[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];

  filterAccountId = '';
  filterFrom = '';
  filterTo = '';

  form: any = { type: 'EXPENSE', date: new Date().toISOString().slice(0, 10), amount: 0 };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe(u => this.users = u);
    this.api.getAccounts().subscribe(a => this.accounts = a);
    this.api.getCategories().subscribe(c => this.categories = c);
    this.load();
  }

  get filteredCategories() {
    return this.categories.filter(c => c.type === this.form.type);
  }

  accountLabel(a: Account) {
    const u = this.users.find(u => u.id === a.userId);
    return `${a.name} (${u?.name ?? a.userId})`;
  }

  categoryName(id: number) {
    return this.categories.find(c => c.id === id)?.name ?? id;
  }

  onTypeChange() { this.form.categoryId = ''; }

  load() {
    this.api.getTransactions({
      accountId: this.filterAccountId ? Number(this.filterAccountId) : undefined,
      from: this.filterFrom || undefined,
      to: this.filterTo || undefined,
    }).subscribe(t => this.transactions = t);
  }

  addTransaction() {
    const amount = this.form.type === 'EXPENSE' || this.form.type === 'TRANSFER'
      ? -Math.abs(Number(this.form.amount))
      : Math.abs(Number(this.form.amount));

    this.api.createTransaction({
      account_id: Number(this.form.accountId),
      category_id: Number(this.form.categoryId),
      amount,
      date: this.form.date,
      description: this.form.description || undefined,
      destination_account_id: this.form.type === 'TRANSFER' ? Number(this.form.destinationAccountId) : undefined,
    }).subscribe(() => {
      this.form.amount = 0;
      this.form.description = '';
      this.form.destinationAccountId = '';
      this.load();
    });
  }

  remove(id: number) {
    if (confirm('¿Eliminar esta transacción?')) {
      this.api.deleteTransaction(id).subscribe(() => this.load());
    }
  }
}
