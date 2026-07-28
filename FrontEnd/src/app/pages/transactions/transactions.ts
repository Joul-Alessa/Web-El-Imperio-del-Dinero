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
          <select [(ngModel)]="formAccountId">
            <option value="">Cuenta origen</option>
            @for (a of accounts; track a.id) {
              <option [value]="a.id">{{ accountLabel(a) }}</option>
            }
          </select>
          <select [(ngModel)]="formType">
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE">Gasto</option>
            <option value="TRANSFER">Transferencia</option>
          </select>
          <select [(ngModel)]="formCategoryId">
            <option value="">Categoría</option>
            @for (c of filteredCategories(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>
        <div class="form-row">
          <input type="number" [(ngModel)]="formAmount" placeholder="Monto" />
          <input type="date" [(ngModel)]="formDate" />
          <input [(ngModel)]="formDesc" placeholder="Descripción (opcional)" />
        </div>
        @if (formType === 'TRANSFER') {
          <div class="form-row">
            <select [(ngModel)]="transferDest">
              <option value="">Cuenta destino</option>
              @for (a of accounts; track a.id) {
                @if (a.id !== +formAccountId) {
                  <option [value]="a.id">{{ accountLabel(a) }}</option>
                }
              }
            </select>
          </div>
        }
        <button (click)="addTransaction()" [disabled]="!formAccountId || !formAmount">Guardar</button>
      </div>
    </details>

    <div class="filters">
      <select [(ngModel)]="filterAccountId" (ngModelChange)="load()">
        <option value="">Todas las cuentas</option>
        @for (a of accounts; track a.id) {
          <option [value]="a.id">{{ accountLabel(a) }}</option>
        }
      </select>
      <input type="date" [(ngModel)]="filterFrom" (ngModelChange)="load()" placeholder="Desde" />
      <input type="date" [(ngModel)]="filterTo" (ngModelChange)="load()" placeholder="Hasta" />
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

  formAccountId = '';
  formType = 'EXPENSE';
  formCategoryId = '';
  formAmount = '';
  formDate = new Date().toISOString().slice(0, 10);
  formDesc = '';
  transferDest = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe({
      next: u => this.users = u,
      error: e => console.error('Error al cargar personas', e),
    });
    this.api.getAccounts().subscribe({
      next: a => this.accounts = a,
      error: e => console.error('Error al cargar cuentas', e),
    });
    this.api.getCategories().subscribe({
      next: c => this.categories = c,
      error: e => console.error('Error al cargar categorías', e),
    });
    this.load();
  }

  filteredCategories() {
    return this.categories.filter(c => c.type === this.formType);
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
    }).subscribe({
      next: t => this.transactions = t,
      error: e => console.error('Error al cargar transacciones', e),
    });
  }

  addTransaction() {
    if (!this.formAccountId || !this.formAmount) return;
    const numericAmount = this.formType === 'EXPENSE' || this.formType === 'TRANSFER'
      ? -Math.abs(Number(this.formAmount))
      : Math.abs(Number(this.formAmount));

    this.api.createTransaction({
      account_id: Number(this.formAccountId),
      category_id: this.formCategoryId ? Number(this.formCategoryId) : undefined,
      amount: numericAmount,
      date: this.formDate,
      description: this.formDesc || undefined,
      destination_account_id: this.formType === 'TRANSFER' && this.transferDest ? Number(this.transferDest) : undefined,
    }).subscribe({
      next: () => { this.formAmount = ''; this.formDesc = ''; this.load(); },
      error: e => console.error('Error al crear transacción', e),
    });
  }

  remove(id: number) {
    if (confirm('¿Eliminar esta transacción?')) {
      this.api.deleteTransaction(id).subscribe({
        next: () => this.load(),
        error: e => console.error('Error al eliminar transacción', e),
      });
    }
  }
}
