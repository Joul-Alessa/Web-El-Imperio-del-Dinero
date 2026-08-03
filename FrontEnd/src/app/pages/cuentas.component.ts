import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Cuenta, Persona, Institucion, Divisa, Instrumento } from '../core/models';

const TIPOS_CUENTA = ['efectivo', 'débito', 'crédito', 'apartado', 'inversión'];
const TIPO_CUENTA_LABELS: Record<string, string> = {
  'efectivo': 'Efectivo',
  'débito': 'Débito',
  'crédito': 'Crédito',
  'apartado': 'Apartado',
  'inversión': 'Inversión',
};

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Cuentas financieras</h1>
          <div class="subtitle">Todo lugar donde hay dinero: efectivo, tarjetas, apartados e inversiones</div>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">＋ Nueva cuenta</button>
      </div>

      <!-- Filtros -->
      <div class="card filters">
        <div class="field">
          <label>Persona</label>
          <select class="select" [(ngModel)]="fPersona" (ngModelChange)="load()">
            <option [ngValue]="null">Todas</option>
            @for (p of personas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Institución</label>
          <select class="select" [(ngModel)]="fInstitucion" (ngModelChange)="load()">
            <option [ngValue]="null">Todas</option>
            @for (i of instituciones(); track i.id) { <option [ngValue]="i.id">{{ i.nombre }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Tipo</label>
          <select class="select" [(ngModel)]="fTipo" (ngModelChange)="load()">
            <option [ngValue]="null">Todos</option>
            @for (t of tipos; track t) { <option [ngValue]="t">{{ tipoLabels[t] }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Divisa</label>
          <select class="select" [(ngModel)]="fDivisa" (ngModelChange)="load()">
            <option [ngValue]="null">Todas</option>
            @for (d of divisas(); track d.id) { <option [ngValue]="d.id">{{ d.codigo }}</option> }
          </select>
        </div>
        <div class="field" style="just-content:flex-end">
          <label>&nbsp;</label>
          <button class="btn" (click)="clearFilters()">Limpiar filtros</button>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (cuentas().length === 0) {
        <div class="card empty-state">
          <div class="icon">🏦</div>
          <p>No hay cuentas que coincidan.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Cuenta</th><th>Persona</th><th>Institución</th><th>Tipo</th>
                <th>Instrumento</th><th>Divisa</th><th class="num">Valor actual</th><th class="actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of cuentas(); track c.id) {
                <tr>
                  <td><strong>{{ c.nombre }}</strong>@if (c.plazo) { <div class="muted" style="font-size:.8rem">Plazo: {{ c.plazo }}</div> }</td>
                  <td>{{ c.persona_nombre }}</td>
                  <td>{{ c.institucion_nombre || '—' }}</td>
                  <td><span class="badge">{{ tipoLabels[c.tipo] || c.tipo }}</span></td>
                  <td>{{ c.instrumento_nombre || '—' }}</td>
                  <td><span class="badge badge-primary">{{ c.divisa_codigo }}</span></td>
                  <td class="num">{{ c.valor_actual != null ? (c.divisa_simbolo + ' ' + fmt(c.valor_actual)) : '—' }}</td>
                  <td class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="openEdit(c)">✏️</button>
                    <button class="btn btn-sm btn-danger" (click)="remove(c)">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showForm()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing().id ? 'Editar cuenta' : 'Nueva cuenta' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field" style="grid-column: 1 / -1">
                <label>Nombre de la cuenta</label>
                <input class="input" [(ngModel)]="editing().nombre" placeholder="Ej. Débito BBVA Nómina, NVIDIA en GBM" />
              </div>
              <div class="field">
                <label>Persona (dueño)</label>
                <select class="select" [(ngModel)]="editing().persona_id">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  @for (p of personas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
                </select>
              </div>
              <div class="field">
                <label>Institución</label>
                <select class="select" [(ngModel)]="editing().institucion_id">
                  <option [ngValue]="null">— Ninguna —</option>
                  @for (i of instituciones(); track i.id) { <option [ngValue]="i.id">{{ i.nombre }}</option> }
                </select>
              </div>
              <div class="field">
                <label>Tipo de cuenta</label>
                <select class="select" [(ngModel)]="editing().tipo">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  @for (t of tipos; track t) { <option [ngValue]="t">{{ tipoLabels[t] }}</option> }
                </select>
              </div>
              <div class="field">
                <label>Divisa</label>
                <select class="select" [(ngModel)]="editing().divisa_id">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  @for (d of divisas(); track d.id) { <option [ngValue]="d.id">{{ d.codigo }} — {{ d.nombre }}</option> }
                </select>
              </div>

              @if (esInversion()) {
                <div class="field" style="grid-column: 1 / -1">
                  <label>Instrumento (solo cuentas de inversión)</label>
                  <select class="select" [(ngModel)]="editing().instrumento_id">
                    <option [ngValue]="null">— Ninguno —</option>
                    @for (ins of instrumentos(); track ins.id) { <option [ngValue]="ins.id">{{ ins.nombre }}</option> }
                  </select>
                </div>

                <div class="field">
                  <label>Plazo</label>
                  <input class="input" [(ngModel)]="editing().plazo" placeholder="Ej. 1 mes, 2 años" />
                </div>
                <div class="field">
                  <label>Cantidad (títulos)</label>
                  <input class="input" type="number" step="any" [(ngModel)]="editing().cantidad" placeholder="0" />
                </div>
                <div class="field">
                  <label>Valor de compra</label>
                  <input class="input" type="number" step="any" [(ngModel)]="editing().valor_compra" placeholder="0" />
                </div>
                <div class="field">
                  <label>Valor actual</label>
                  <input class="input" type="number" step="any" [(ngModel)]="editing().valor_actual" placeholder="0" />
                </div>
              }
              <div class="field" style="grid-column: 1 / -1">
                <label>Descripción</label>
                <textarea class="textarea" [(ngModel)]="editing().descripcion" placeholder="Opcional"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="close()">Cancelar</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!isValid()">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CuentasComponent implements OnInit {
  cuentas = signal<Cuenta[]>([]);
  personas = signal<Persona[]>([]);
  instituciones = signal<Institucion[]>([]);
  divisas = signal<Divisa[]>([]);
  instrumentos = signal<Instrumento[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Cuenta>(this.blank());

  tipos = TIPOS_CUENTA;

  fPersona: number | null = null;
  fInstitucion: number | null = null;
  fTipo: string | null = null;
  fDivisa: number | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    forkJoin({
      personas: this.api.getPersonas(),
      instituciones: this.api.getInstituciones(),
      divisas: this.api.getDivisas(),
      instrumentos: this.api.getInstrumentos(),
    }).subscribe(({ personas, instituciones, divisas, instrumentos }) => {
      this.personas.set(personas);
      this.instituciones.set(instituciones);
      this.divisas.set(divisas);
      this.instrumentos.set(instrumentos);
      this.load();
    });
  }

  readonly tipoLabels = TIPO_CUENTA_LABELS;

  esInversion(): boolean {
    return this.editing().tipo === 'inversión';
  }

  blank(): Cuenta {
    return {
      persona_id: null as any, institucion_id: null, tipo: null as any,
      instrumento_id: null, divisa_id: null as any, nombre: '',
      plazo: null, cantidad: null, valor_compra: null, valor_actual: null, descripcion: null,
    };
  }

  load() {
    this.loading.set(true);
    this.api.getCuentas({
      persona_id: this.fPersona ? [this.fPersona] : undefined,
      institucion_id: this.fInstitucion ? [this.fInstitucion] : undefined,
      tipo: this.fTipo ?? undefined,
      divisa_id: this.fDivisa ?? undefined,
    }).subscribe({
      next: (d) => { this.cuentas.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clearFilters() {
    this.fPersona = null; this.fInstitucion = null; this.fTipo = null; this.fDivisa = null;
    this.load();
  }

  openCreate() {
    this.editing.set(this.blank());
    this.showForm.set(true);
  }
  openEdit(c: Cuenta) { this.editing.set({ ...c }); this.showForm.set(true); }
  close() { this.showForm.set(false); }

  isValid(): boolean {
    const c = this.editing();
    return !!(c.nombre && c.persona_id && c.tipo && c.divisa_id);
  }

  save() {
    const c = this.editing();
    const req = c.id ? this.api.updateCuenta(c.id, c) : this.api.createCuenta(c);
    req.subscribe(() => { this.close(); this.load(); });
  }

  remove(c: Cuenta) {
    if (!c.id) return;
    if (!confirm(`¿Eliminar la cuenta "${c.nombre}"?`)) return;
    this.api.deleteCuenta(c.id).subscribe(() => this.load());
  }

  fmt(n: number): string {
    return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
