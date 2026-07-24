import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Account, User } from '../../services/api.service';
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, ArcElement, LineController, LineElement, PointElement,
} from 'chart.js';

Chart.register(
  BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, ArcElement, LineController, LineElement, PointElement,
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Dashboard</h2>

    <div class="filters">
      <select [(ngModel)]="filterUserId" (change)="load()">
        <option value="">Todas las personas</option>
        @for (u of users; track u.id) { <option [value]="u.id">{{ u.name }}</option> }
      </select>
      <select [(ngModel)]="filterAccountType" (change)="load()">
        <option value="">Todos los tipos</option>
        <option value="DEBIT">Débito</option>
        <option value="CREDIT">Crédito</option>
        <option value="INVESTMENT">Inversión</option>
        <option value="CASH">Efectivo</option>
      </select>
      <input type="date" [(ngModel)]="filterFrom" (change)="load()" />
      <input type="date" [(ngModel)]="filterTo" (change)="load()" />
      <label><input type="checkbox" [(ngModel)]="cumulative" (change)="load()" /> Incluir historial pasado</label>
    </div>

    <div class="summary">
      <div class="card">Ingresos<br/><span class="positive">{{ summary.totalIncome | number:'1.2-2' }}</span></div>
      <div class="card">Gastos<br/><span class="negative">{{ summary.totalExpense | number:'1.2-2' }}</span></div>
      <div class="card">Flujo neto<br/><span [class.positive]="summary.netFlow >= 0" [class.negative]="summary.netFlow < 0">{{ summary.netFlow | number:'1.2-2' }}</span></div>
      <div class="card">Transacciones<br/>{{ summary.transactionCount }}</div>
    </div>

    <div class="charts">
      <div class="chart-box">
        <h3>Ingresos vs Gastos</h3>
        <canvas #barChart></canvas>
      </div>
      <div class="chart-box">
        <h3>Categorías</h3>
        <canvas #doughnutChart></canvas>
      </div>
    </div>

    <div class="chart-box full">
      <h3>Tendencia mensual</h3>
      <canvas #lineChart></canvas>
    </div>
  `,
  styles: [`
    .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .filters label { display: flex; align-items: center; gap: 4px; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .card { flex: 1; min-width: 120px; background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; font-weight: 500; }
    .card span { font-size: 1.4em; font-weight: 700; display: block; margin-top: 4px; }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }
    .charts { display: flex; gap: 16px; margin-bottom: 16px; }
    .chart-box { flex: 1; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
    .chart-box.full { width: 100%; }
    .chart-box canvas { max-height: 300px; max-width: 100%; }
    h3 { margin: 0 0 12px 0; font-size: 1rem; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineCanvas!: ElementRef<HTMLCanvasElement>;

  users: User[] = [];
  accounts: Account[] = [];

  filterUserId = '';
  filterAccountType = '';
  filterFrom = '';
  filterTo = '';
  cumulative = false;

  summary: any = {};
  topCategories: any[] = [];
  monthlyTrend: any[] = [];

  private barChart?: Chart;
  private doughnutChart?: Chart;
  private lineChart?: Chart;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers().subscribe(u => this.users = u);
    this.load();
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 500);
  }

  load() {
    this.api.getAnalytics({
      from: this.filterFrom || undefined,
      to: this.filterTo || undefined,
      userId: this.filterUserId ? Number(this.filterUserId) : undefined,
      accountType: this.filterAccountType || undefined,
      cumulative: this.cumulative,
    }).subscribe(data => {
      this.summary = data.summary;
      this.topCategories = data.topCategories ?? [];
      this.monthlyTrend = data.monthlyTrend ?? [];
      this.renderCharts();
    });
  }

  private renderCharts() {
    this.renderBarChart();
    this.renderDoughnutChart();
    this.renderLineChart();
  }

  private renderBarChart() {
    this.barChart?.destroy();
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          label: 'MXN',
          data: [this.summary.totalIncome ?? 0, this.summary.totalExpense ?? 0],
          backgroundColor: ['#4caf50', '#f44336'],
        }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }

  private renderDoughnutChart() {
    this.doughnutChart?.destroy();
    const data = this.topCategories;
    if (!data.length) return;
    const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#3f51b5', '#ff5722', '#607d8b', '#795548'];
    this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.slice(0, 8).map((c: any) => c.categoryName),
        datasets: [{
          data: data.slice(0, 8).map((c: any) => c.total),
          backgroundColor: colors,
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } },
    });
  }

  private renderLineChart() {
    this.lineChart?.destroy();
    const trend = this.monthlyTrend;
    if (!trend.length) return;
    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: trend.map((t: any) => t.month),
        datasets: [
          { label: 'Ingresos', data: trend.map((t: any) => t.income), borderColor: '#4caf50', tension: 0.3, fill: false },
          { label: 'Gastos', data: trend.map((t: any) => t.expense), borderColor: '#f44336', tension: 0.3, fill: false },
          { label: 'Neto', data: trend.map((t: any) => t.net), borderColor: '#2196f3', tension: 0.3, fill: false, borderDash: [5, 5] },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
  }
}
