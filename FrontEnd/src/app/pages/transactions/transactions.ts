import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Account, User, Category, Transaction } from '../../services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Transacciones</h2>

    <details>
      <summary>Nueva transacción</summary>
      <div class="form-card">
        <div class="form-row">
          <select #formAccountSelect>
            <option value="">Cuenta origen</option>
            @for (a of accounts; track a.id) {
              <option [value]="a.id">{{ accountLabel(a) }}</option>
            }
          </select>
          <select #formTypeSelect (change)="formType = formTypeSelect.value">
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE" selected>Gasto</option>
            <option value="TRANSFER">Transferencia</option>
          </select>
          <select #formCategorySelect>
            <option value="">Categoría</option>
            @for (c of filteredCategories(formType); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>
        <div class="form-row">
          <input type="number" #formAmount placeholder="Monto" />
          <input type="date" #formDate [value]="today" />
          <input #formDesc placeholder="Descripción (opcional)" />
        </div>
        @if (formType === 'TRANSFER') {
          <div class="form-row">
            <select (change)="transferDest = $any($event.target).value">
              <option value="">Cuenta destino</option>
              @for (a of accounts; track a.id) {
                @if (a.id !== (+formAccountSelect.value)) {
                  <option [value]="a.id">{{ accountLabel(a) }}</option>
                }
              }
            </select>
          </div>
        }
        <button (click)="addTransaction(formAccountSelect.value, formTypeSelect.value, formCategorySelect.value, formAmount.value, formDate.value, formDesc.value)">Guardar</button>
      </div>
    </details>

    <div class="filters">
      <select (change)="filterAccountId = $any($event.target).value; load()">
        <option value="">Todas las cuentas</option>
        @for (a of accounts; track a.id) {
          <option [value]="a.id">{{ accountLabel(a) }}</option>
        }
      </select>
      <input type="date" (change)="filterFrom = $any($event.target).value; load()" placeholder="Desde" />
      <input type="date" (change)="filterTo = $any($event.target).value; load()" placeholder="Hasta" />
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
    .form-card { border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius); margin-bottom: 16px; background: var(--bg-surface); }
    .form-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color); }
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

  formType = 'EXPENSE';
  transferDest = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe(u => this.users = u);
    this.api.getAccounts().subscribe(a => this.accounts = a);
    this.api.getCategories().subscribe(c => this.categories = c);
    this.load();
  }

  get today() { return new Date().toISOString().slice(0, 10); }

  filteredCategories(type: string) {
    return this.categories.filter(c => c.type === type);
  }

  accountLabel(a: Account) {
    const u = this.users.find(u => u.id === a.userId);
    return `${a.name} (${u?.name ?? a.userId})`;
  }

  categoryName(id: number) {
    return this.categories.find(c => c.id === id)?.name ?? id;
  }

  load() {
    this.api.getTransactions({
      accountId: this.filterAccountId ? Number(this.filterAccountId) : undefined,
      from: this.filterFrom || undefined,
      to: this.filterTo || undefined,
    }).subscribe(t => this.transactions = t);
  }

  addTransaction(accountId: string, type: string, categoryId: string, amount: string, date: string, description: string) {
    const numericAmount = type === 'EXPENSE' || type === 'TRANSFER'
      ? -Math.abs(Number(amount))
      : Math.abs(Number(amount));

    this.api.createTransaction({
      account_id: Number(accountId),
      category_id: Number(categoryId),
      amount: numericAmount,
      date,
      description: description || undefined,
      destination_account_id: type === 'TRANSFER' ? Number(this.transferDest) || undefined : undefined,
    }).subscribe(() => {
      this.load();
    });
  }

  remove(id: number) {
    if (confirm('¿Eliminar esta transacción?')) {
      this.api.deleteTransaction(id).subscribe(() => this.load());
    }
  }
}
