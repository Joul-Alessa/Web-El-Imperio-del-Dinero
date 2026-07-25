import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Account, User, Asset } from '../../services/api.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Inversiones y Rendimientos</h2>

    <details>
      <summary>Nuevo activo</summary>
      <div class="form-row">
        <input #assetTicker placeholder="Ticker (ej. NVDA)" />
        <input #assetName placeholder="Nombre" />
        <select #assetType>
          <option value="STOCK">Acción</option>
          <option value="ETF">ETF</option>
          <option value="BOND">Bono</option>
          <option value="CRYPTO">Crypto</option>
        </select>
        <button (click)="addAsset(assetTicker.value, assetName.value, assetType.value); assetTicker.value = ''; assetName.value = ''">Crear activo</button>
      </div>
    </details>

    <details>
      <summary>Registrar trade</summary>
      <div class="form-card">
        <div class="form-row">
          <select #tradeAccount><option value="">Cuenta</option>@for (a of investAccounts; track a.id){<option [value]="a.id">{{a.name}}</option>}</select>
          <select #tradeAsset><option value="">Activo</option>@for (a of assets; track a.id){<option [value]="a.id">{{a.ticker}} - {{a.name}}</option>}</select>
          <select #tradeType><option value="BUY">Compra</option><option value="SELL">Venta</option></select>
        </div>
        <div class="form-row">
          <input type="number" #tradeQuantity placeholder="Cantidad" />
          <input type="number" #tradePrice placeholder="Precio unitario" />
          <input type="number" #tradeFee placeholder="Comisión" />
          <input type="date" #tradeDate [value]="today" />
        </div>
        <button (click)="doTrade(tradeAccount.value, tradeAsset.value, tradeType.value, tradeQuantity.value, tradePrice.value, tradeFee.value, tradeDate.value)">Ejecutar</button>
      </div>
    </details>

    <details>
      <summary>Revaluar cuenta</summary>
      <div class="form-row">
        <select #revAccount><option value="">Cuenta</option>@for (a of accounts; track a.id){<option [value]="a.id">{{a.name}}</option>}</select>
        <input type="number" #revNewBalance placeholder="Nuevo saldo" />
        <input #revNotes placeholder="Nota (opcional)" />
        <button (click)="doRevaluate(revAccount.value, revNewBalance.value, revNotes.value)">Revaluar</button>
      </div>
    </details>

    <h3>Portafolio</h3>
    <table>
      <thead><tr><th>Activo</th><th>Ticker</th><th>Tipo</th><th>Cantidad</th><th>Precio prom.</th><th>Cuenta</th><th>Persona</th></tr></thead>
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

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe(u => this.users = u);
    this.api.getAccounts().subscribe(a => {
      this.accounts = a;
      this.investAccounts = a.filter(ac => ac.type === 'INVESTMENT');
    });
    this.api.getAssets().subscribe(a => this.assets = a);
    this.loadPortfolio();
  }

  get today() { return new Date().toISOString().slice(0, 10); }

  loadPortfolio() { this.api.getPortfolio().subscribe(p => this.portfolio = p); }

  addAsset(ticker: string, name: string, assetType: string) {
    if (!ticker.trim()) return;
    this.api.createAsset({
      ticker: ticker.trim().toUpperCase(),
      name: name.trim(),
      asset_type: assetType,
    }).subscribe(() => {
      this.api.getAssets().subscribe(a => this.assets = a);
    });
  }

  doTrade(accountId: string, assetId: string, transactionType: string, quantity: string, pricePerUnit: string, fee: string, date: string) {
    if (!accountId || !assetId) return;
    this.api.trade({
      account_id: Number(accountId),
      asset_id: Number(assetId),
      transaction_type: transactionType,
      quantity: Number(quantity),
      price_per_unit: Number(pricePerUnit),
      fee: Number(fee || 0),
      date,
    }).subscribe(() => this.loadPortfolio());
  }

  doRevaluate(accountId: string, newBalance: string, notes: string) {
    if (!accountId) return;
    this.api.revaluate(Number(accountId), Number(newBalance), notes || undefined)
      .subscribe(() => {});
  }
}
