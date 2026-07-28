import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Account, User, Asset } from '../../services/api.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Inversiones y Rendimientos</h2>

    <details>
      <summary>Nuevo activo</summary>
      <div class="form-row">
        <input [(ngModel)]="assetForm.ticker" placeholder="Ticker (ej. NVDA)" />
        <input [(ngModel)]="assetForm.name" placeholder="Nombre" />
        <select [(ngModel)]="assetForm.type">
          <option value="STOCK">Acción</option>
          <option value="ETF">ETF</option>
          <option value="BOND">Bono</option>
          <option value="CRYPTO">Crypto</option>
        </select>
        <button (click)="addAsset()" [disabled]="!assetForm.ticker.trim()">Crear activo</button>
      </div>
    </details>

    <details>
      <summary>Registrar trade</summary>
      <div class="form-card">
        <div class="form-row">
          <select [(ngModel)]="tradeForm.accountId">
            <option value="">Cuenta</option>
            @for (a of investAccounts; track a.id) { <option [value]="a.id">{{ a.name }}</option> }
          </select>
          <select [(ngModel)]="tradeForm.assetId">
            <option value="">Activo</option>
            @for (a of assets; track a.id) { <option [value]="a.id">{{ a.ticker }} - {{ a.name }}</option> }
          </select>
          <select [(ngModel)]="tradeForm.type">
            <option value="BUY">Compra</option>
            <option value="SELL">Venta</option>
          </select>
        </div>
        <div class="form-row">
          <input type="number" [(ngModel)]="tradeForm.quantity" placeholder="Cantidad" />
          <input type="number" [(ngModel)]="tradeForm.price" placeholder="Precio unitario" />
          <input type="number" [(ngModel)]="tradeForm.fee" placeholder="Comisión" />
          <input type="date" [(ngModel)]="tradeForm.date" />
        </div>
        <button (click)="doTrade()" [disabled]="!tradeForm.accountId || !tradeForm.assetId">Ejecutar</button>
      </div>
    </details>

    <details>
      <summary>Revaluar cuenta</summary>
      <div class="form-row">
        <select [(ngModel)]="revForm.accountId">
          <option value="">Cuenta</option>
          @for (a of accounts; track a.id) { <option [value]="a.id">{{ a.name }}</option> }
        </select>
        <input type="number" [(ngModel)]="revForm.newBalance" placeholder="Nuevo saldo" />
        <input [(ngModel)]="revForm.notes" placeholder="Nota (opcional)" />
        <button (click)="doRevaluate()" [disabled]="!revForm.accountId">Revaluar</button>
      </div>
    </details>

    <h3>Portafolio</h3>
    <table>
      <thead>
        <tr><th>Activo</th><th>Ticker</th><th>Tipo</th><th>Cantidad</th><th>Precio prom.</th><th>Cuenta</th><th>Persona</th></tr>
      </thead>
      <tbody>
        @for (h of portfolio; track h.holdingId) {
          <tr>
            <td>{{ h.assetName }}</td>
            <td>{{ h.ticker }}</td>
            <td>{{ h.assetType }}</td>
            <td>{{ h.quantity }}</td>
            <td>{{ h.avgBuyPrice | number:'1.2-4' }}</td>
            <td>{{ h.accountName }}</td>
            <td>{{ h.userName }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    .form-card { border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius); margin-bottom: 16px; background: var(--bg-surface); }
    .form-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color); }
    details { margin-bottom: 16px; }
    summary { cursor: pointer; margin-bottom: 8px; font-weight: bold; }
    h3 { margin-top: 24px; }
  `]
})
export class InvestmentsComponent implements OnInit {
  accounts: Account[] = [];
  users: User[] = [];
  assets: Asset[] = [];
  portfolio: any[] = [];
  investAccounts: Account[] = [];

  assetForm = { ticker: '', name: '', type: 'STOCK' };
  tradeForm = { accountId: '', assetId: '', type: 'BUY', quantity: '', price: '', fee: '', date: new Date().toISOString().slice(0, 10) };
  revForm = { accountId: '', newBalance: '', notes: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe({
      next: u => this.users = u,
      error: e => console.error('Error al cargar personas', e),
    });
    this.api.getAccounts().subscribe({
      next: a => { this.accounts = a; this.investAccounts = a.filter(ac => ac.type === 'INVESTMENT'); },
      error: e => console.error('Error al cargar cuentas', e),
    });
    this.api.getAssets().subscribe({
      next: a => this.assets = a,
      error: e => console.error('Error al cargar activos', e),
    });
    this.loadPortfolio();
  }

  loadPortfolio() {
    this.api.getPortfolio().subscribe({
      next: p => this.portfolio = p,
      error: e => console.error('Error al cargar portafolio', e),
    });
  }

  addAsset() {
    if (!this.assetForm.ticker.trim()) return;
    this.api.createAsset({
      ticker: this.assetForm.ticker.trim().toUpperCase(),
      name: this.assetForm.name.trim(),
      asset_type: this.assetForm.type,
    }).subscribe({
      next: () => {
        this.assetForm.ticker = '';
        this.assetForm.name = '';
        this.api.getAssets().subscribe({ next: a => this.assets = a });
      },
      error: e => console.error('Error al crear activo', e),
    });
  }

  doTrade() {
    if (!this.tradeForm.accountId || !this.tradeForm.assetId) return;
    this.api.trade({
      account_id: Number(this.tradeForm.accountId),
      asset_id: Number(this.tradeForm.assetId),
      transaction_type: this.tradeForm.type,
      quantity: Number(this.tradeForm.quantity),
      price_per_unit: Number(this.tradeForm.price),
      fee: Number(this.tradeForm.fee || 0),
      date: this.tradeForm.date,
    }).subscribe({
      next: () => this.loadPortfolio(),
      error: e => console.error('Error al registrar trade', e),
    });
  }

  doRevaluate() {
    if (!this.revForm.accountId) return;
    this.api.revaluate(Number(this.revForm.accountId), Number(this.revForm.newBalance), this.revForm.notes || undefined)
      .subscribe({
        next: () => { this.revForm.newBalance = ''; this.revForm.notes = ''; },
        error: e => console.error('Error al revaluar cuenta', e),
      });
  }
}
