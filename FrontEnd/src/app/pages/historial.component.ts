import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Historial } from '../core/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Historial</h1>
          <div class="subtitle">Registro de actividad de la aplicación</div>
        </div>
      </div>

      <div class="filters-bar">
        <div class="field">
          <label>Entidad</label>
          <select class="select" [(ngModel)]="filtroEntidad" (ngModelChange)="load()">
            <option value="">Todas</option>
            <option value="personas">Personas</option>
            <option value="instituciones">Instituciones</option>
            <option value="divisas">Divisas</option>
            <option value="instrumentos">Instrumentos</option>
            <option value="cuentas">Cuentas</option>
            <option value="movimientos">Movimientos</option>
          </select>
        </div>
        <div class="field">
          <label>Acción</label>
          <select class="select" [(ngModel)]="filtroAccion" (ngModelChange)="load()">
            <option value="">Todas</option>
            <option value="creado">Creado</option>
            <option value="editado">Editado</option>
            <option value="eliminado">Eliminado</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (items().length === 0) {
        <div class="card empty-state">
          <div class="icon">📜</div>
          <p>No hay registros de actividad todavía.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th style="width:180px">Fecha</th>
                <th>Entidad</th>
                <th style="width:80px">ID Reg.</th>
                <th style="width:120px">Acción</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              @for (h of items(); track h.id) {
                <tr>
                  <td class="muted">{{ h.fecha | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td><span class="badge">{{ entidadLabels[h.entidad] || h.entidad }}</span></td>
                  <td class="muted">#{{ h.entidad_id }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + h.accion">{{ accionLabels[h.accion] || h.accion }}</span>
                  </td>
                  <td class="detalle-cell">{{ formatDetalle(h.detalle) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filters-bar .field {
      min-width: 160px;
    }
    .badge-creado {
      background: var(--color-success, #22c55e) !important;
      color: #fff !important;
    }
    .badge-editado {
      background: var(--color-warning, #eab308) !important;
      color: #000 !important;
    }
    .badge-eliminado {
      background: var(--color-danger, #ef4444) !important;
      color: #fff !important;
    }
    .detalle-cell {
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.85em;
    }
  `],
})
export class HistorialComponent implements OnInit {
  items = signal<Historial[]>([]);
  loading = signal(true);

  filtroEntidad = '';
  filtroAccion = '';

  readonly entidadLabels: Record<string, string> = {
    personas: 'Personas',
    instituciones: 'Instituciones',
    divisas: 'Divisas',
    instrumentos: 'Instrumentos',
    cuentas: 'Cuentas',
    movimientos: 'Movimientos',
  };

  readonly accionLabels: Record<string, string> = {
    creado: 'Creado',
    editado: 'Editado',
    eliminado: 'Eliminado',
  };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getHistorial({
      entidad: this.filtroEntidad || undefined,
      accion: this.filtroAccion || undefined,
    }).subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDetalle(detalle: any): string {
    if (!detalle) return '';
    const obj = typeof detalle === 'string' ? JSON.parse(detalle) : detalle;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'id' || v === null || v === undefined) continue;
      parts.push(`${k}: ${v}`);
    }
    return parts.join(', ');
  }
}
