import { Component, OnInit, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ApiService } from '../services/api.service';
import { ThemeService } from '../services/theme.service';
import { Movimiento, Cuenta, Persona, Institucion } from '../core/models';
import { ChartComponent } from '../shared/chart.component';

const PALETTE = ['#0e7c5a', '#c8971a', '#2b71c9', '#d4483b', '#7c4dff', '#12986a', '#e0662b', '#0891b2', '#b5179e', '#5c6ac4'];

type GroupDim = 'persona' | 'cuenta' | 'institucion' | 'instrumento' | 'divisa';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, ChartComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <div class="subtitle">Panorama de las finanzas del imperio</div>
        </div>
        <button class="btn" (click)="reload()">🔄 Actualizar</button>
      </div>

      <!-- Filtros -->
      <div class="card filters">
        <div class="field">
          <label>Persona</label>
          <select class="select" [(ngModel)]="fPersona" (ngModelChange)="recompute()">
            <option [ngValue]="null">Todas</option>
            @for (p of personas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Institución</label>
          <select class="select" [(ngModel)]="fInstitucion" (ngModelChange)="recompute()">
            <option [ngValue]="null">Todas</option>
            @for (i of instituciones(); track i.id) { <option [ngValue]="i.id">{{ i.nombre }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Tipo</label>
          <select class="select" [(ngModel)]="fTipo" (ngModelChange)="recompute()">
            <option [ngValue]="null">Todos</option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
            <option value="revalorizacion">Revalorización</option>
          </select>
        </div>
        <div class="field">
          <label>Desde</label>
          <input class="input" type="date" [(ngModel)]="fDesde" (ngModelChange)="recompute()" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input class="input" type="date" [(ngModel)]="fHasta" (ngModelChange)="recompute()" />
        </div>
        <div class="field">
          <label>Agrupar por</label>
          <select class="select" [(ngModel)]="groupDim" (ngModelChange)="recompute()">
            <option value="persona">Persona</option>
            <option value="cuenta">Cuenta</option>
            <option value="institucion">Institución</option>
            <option value="instrumento">Instrumento</option>
            <option value="divisa">Divisa</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else {
        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="card stat">
            <div class="stat-label">Patrimonio total</div>
            <div class="stat-value">{{ fmt(patrimonio()) }}</div>
            <div class="stat-sub muted">{{ cuentasCount() }} cuentas</div>
          </div>
          <div class="card stat">
            <div class="stat-label">Ingresos</div>
            <div class="stat-value amount-pos">{{ fmt(ingresos()) }}</div>
            <div class="stat-sub muted">en el periodo</div>
          </div>
          <div class="card stat">
            <div class="stat-label">Gastos</div>
            <div class="stat-value amount-neg">{{ fmt(gastos()) }}</div>
            <div class="stat-sub muted">en el periodo</div>
          </div>
          <div class="card stat">
            <div class="stat-label">Flujo neto</div>
            <div class="stat-value" [class.amount-pos]="flujoNeto() >= 0" [class.amount-neg]="flujoNeto() < 0">
              {{ fmt(flujoNeto()) }}
            </div>
            <div class="stat-sub muted">ingresos − gastos</div>
          </div>
        </div>

        @if (movsFiltrados().length === 0 && patrimonio() === 0) {
          <div class="card empty-state" style="margin-top:20px">
            <div class="icon">📊</div>
            <p>No hay datos que mostrar. Registra cuentas y movimientos para ver estadísticas.</p>
          </div>
        } @else {
          <!-- Charts -->
          <div class="charts-grid">
            <div class="card chart-card wide">
              <div class="chart-head">
                <h3>Flujo acumulado en el tiempo</h3>
                <label class="acc-toggle">
                  <input type="checkbox" [(ngModel)]="arrastrar" (ngModelChange)="recompute()" />
                  Arrastrar saldo previo
                </label>
              </div>
              <div class="chart-body">
                <app-chart type="line" [data]="lineData()" [options]="lineOptions()"></app-chart>
              </div>
            </div>

            <div class="card chart-card">
              <div class="chart-head"><h3>Ingresos vs Gastos por {{ groupLabel() }}</h3></div>
              <div class="chart-body">
                <app-chart type="bar" [data]="barData()" [options]="barOptions()"></app-chart>
              </div>
            </div>

            <div class="card chart-card">
              <div class="chart-head"><h3>Patrimonio por {{ groupLabel() }}</h3></div>
              <div class="chart-body">
                <app-chart type="doughnut" [data]="doughnutData()" [options]="doughnutOptions()"></app-chart>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat { padding: 18px 20px; }
    .stat-label { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; }
    .stat-value { font-size: 1.7rem; font-weight: 800; margin: 6px 0 2px; letter-spacing: -0.02em; }
    .stat-sub { font-size: 0.78rem; }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .chart-card { padding: 18px 20px; }
    .chart-card.wide { grid-column: 1 / -1; }
    .chart-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .chart-head h3 { font-size: 1rem; }
    .chart-body { height: 300px; }
    .acc-toggle { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: var(--text-muted); cursor: pointer; }

    @media (max-width: 820px) {
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card.wide { grid-column: auto; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  movimientos = signal<Movimiento[]>([]);
  cuentas = signal<Cuenta[]>([]);
  personas = signal<Persona[]>([]);
  instituciones = signal<Institucion[]>([]);
  loading = signal(true);

  // filters
  fPersona: number | null = null;
  fInstitucion: number | null = null;
  fTipo: string | null = null;
  fDesde: string | null = null;
  fHasta: string | null = null;
  groupDim: GroupDim = 'institucion';
  arrastrar = false;

  // derived
  movsFiltrados = signal<Movimiento[]>([]);
  patrimonio = signal(0);
  cuentasCount = signal(0);
  ingresos = signal(0);
  gastos = signal(0);
  flujoNeto = signal(0);

  lineData = signal<ChartConfiguration['data']>({ labels: [], datasets: [] });
  barData = signal<ChartConfiguration['data']>({ labels: [], datasets: [] });
  doughnutData = signal<ChartConfiguration['data']>({ labels: [], datasets: [] });
  lineOptions = signal<ChartConfiguration['options']>({});
  barOptions = signal<ChartConfiguration['options']>({});
  doughnutOptions = signal<ChartConfiguration['options']>({});

  private dataLoaded = false;

  constructor(private api: ApiService, private theme: ThemeService) {
    // Rebuild charts (colors) whenever the theme changes.
    effect(() => {
      this.theme.theme();
      if (this.dataLoaded) this.recompute();
    });
  }

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    forkJoin({
      movimientos: this.api.getMovimientos(),
      cuentas: this.api.getCuentas(),
      personas: this.api.getPersonas(),
      instituciones: this.api.getInstituciones(),
    }).subscribe(({ movimientos, cuentas, personas, instituciones }) => {
      this.movimientos.set(movimientos);
      this.cuentas.set(cuentas);
      this.personas.set(personas);
      this.instituciones.set(instituciones);
      this.dataLoaded = true;
      this.loading.set(false);
      this.recompute();
    });
  }

  private themeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      text: cs.getPropertyValue('--text-muted').trim() || '#666',
      grid: cs.getPropertyValue('--border').trim() || '#ddd',
    };
  }

  private groupValue(m: Movimiento): string {
    switch (this.groupDim) {
      case 'persona': return m.persona_nombre || '—';
      case 'cuenta': return m.cuenta_nombre || '—';
      case 'institucion': return m.institucion_nombre || '—';
      case 'instrumento': return m.instrumento_nombre || 'Sin instrumento';
      case 'divisa': return m.divisa_codigo || '—';
    }
  }

  private groupValueCuenta(c: Cuenta): string {
    switch (this.groupDim) {
      case 'persona': return c.persona_nombre || '—';
      case 'cuenta': return c.nombre || '—';
      case 'institucion': return c.institucion_nombre || '—';
      case 'instrumento': return c.instrumento_nombre || 'Sin instrumento';
      case 'divisa': return c.divisa_codigo || '—';
    }
  }

  groupLabel(): string {
    return { persona: 'persona', cuenta: 'cuenta', institucion: 'institución', instrumento: 'instrumento', divisa: 'divisa' }[this.groupDim];
  }

  private net(m: Movimiento): number {
    const v = Number(m.monto);
    if (m.tipo === 'gasto') return -Math.abs(v);
    return v; // ingreso positivo, revalorizacion ya viene con signo
  }

  recompute() {
    if (!this.dataLoaded) return;

    // client-side filtering (persona / institución / tipo)
    const passNonDate = (m: Movimiento) =>
      (this.fPersona == null || m.persona_id === this.fPersona) &&
      (this.fInstitucion == null || m.institucion_nombre === this.instituciones().find(i => i.id === this.fInstitucion)?.nombre) &&
      (this.fTipo == null || m.tipo === this.fTipo);

    // m.fecha is a datetime string ("YYYY-MM-DDTHH:MM:SS"); compare by date-only slice.
    const inRange = (m: Movimiento) => {
      const d = m.fecha.slice(0, 10);
      return (!this.fDesde || d >= this.fDesde) && (!this.fHasta || d <= this.fHasta);
    };

    const base = this.movimientos().filter(passNonDate);
    const filtered = base.filter(inRange);
    this.movsFiltrados.set(filtered);

    // stats
    const ing = filtered.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + Number(m.monto), 0);
    const gas = filtered.filter(m => m.tipo === 'gasto').reduce((a, m) => a + Number(m.monto), 0);
    this.ingresos.set(ing);
    this.gastos.set(gas);
    this.flujoNeto.set(ing - gas);

    // patrimonio from cuentas (filtered by persona/institución)
    const cuentasF = this.cuentas().filter(c =>
      (this.fPersona == null || c.persona_id === this.fPersona) &&
      (this.fInstitucion == null || c.institucion_id === this.fInstitucion)
    );
    this.patrimonio.set(cuentasF.reduce((a, c) => a + Number(c.valor_actual ?? 0), 0));
    this.cuentasCount.set(cuentasF.length);

    const colors = this.themeColors();
    const commonScales = {
      x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
      y: { ticks: { color: colors.text }, grid: { color: colors.grid } },
    };

    this.buildLine(base, filtered, colors, commonScales);
    this.buildBar(filtered, colors, commonScales);
    this.buildDoughnut(cuentasF, colors);
  }

  private buildLine(base: Movimiento[], filtered: Movimiento[], colors: any, scales: any) {
    // net per date-only (strip the time component so all movements on the same day group).
    const byDate = new Map<string, number>();
    for (const m of filtered) {
      const d = m.fecha.slice(0, 10);
      byDate.set(d, (byDate.get(d) ?? 0) + this.net(m));
    }
    const dates = [...byDate.keys()].sort();

    let running = 0;
    if (this.arrastrar && this.fDesde) {
      running = base.filter(m => m.fecha.slice(0, 10) < this.fDesde!).reduce((a, m) => a + this.net(m), 0);
    }
    const acc: number[] = [];
    for (const d of dates) { running += byDate.get(d)!; acc.push(running); }

    this.lineData.set({
      labels: dates,
      datasets: [{
        label: 'Saldo acumulado',
        data: acc,
        borderColor: PALETTE[0],
        backgroundColor: PALETTE[0] + '33',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      }],
    });
    this.lineOptions.set({
      plugins: { legend: { labels: { color: colors.text } } },
      scales,
    });
  }

  private buildBar(filtered: Movimiento[], colors: any, scales: any) {
    const groups = new Map<string, { ing: number; gas: number }>();
    for (const m of filtered) {
      if (m.tipo === 'revalorizacion') continue;
      const k = this.groupValue(m);
      const g = groups.get(k) ?? { ing: 0, gas: 0 };
      if (m.tipo === 'ingreso') g.ing += Number(m.monto);
      else g.gas += Number(m.monto);
      groups.set(k, g);
    }
    const labels = [...groups.keys()];
    this.barData.set({
      labels,
      datasets: [
        { label: 'Ingresos', data: labels.map(l => groups.get(l)!.ing), backgroundColor: PALETTE[0], borderRadius: 6 },
        { label: 'Gastos', data: labels.map(l => groups.get(l)!.gas), backgroundColor: PALETTE[3], borderRadius: 6 },
      ],
    });
    this.barOptions.set({
      plugins: { legend: { labels: { color: colors.text } } },
      scales,
    });
  }

  private buildDoughnut(cuentasF: Cuenta[], colors: any) {
    const groups = new Map<string, number>();
    for (const c of cuentasF) {
      const k = this.groupValueCuenta(c);
      groups.set(k, (groups.get(k) ?? 0) + Number(c.valor_actual ?? 0));
    }
    const labels = [...groups.keys()];
    this.doughnutData.set({
      labels,
      datasets: [{
        data: labels.map(l => groups.get(l)!),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 0,
      }],
    });
    this.doughnutOptions.set({
      plugins: { legend: { position: 'right', labels: { color: colors.text } } },
    });
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
}
