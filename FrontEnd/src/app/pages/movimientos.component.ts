import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../services/api.service';
import {
  Movimiento, Persona, Cuenta, Divisa, Instrumento, Institucion, RevalorizacionPayload,
} from '../core/models';

interface MovForm {
  id?: number;
  tipo: string;
  fecha: string;
  hora: string;
  persona_id: number | null;
  cuenta_id: number | null;
  monto: number | null;
  divisa_id: number | null;
  instrumento_id: number | null;
  cantidad: number | null;
  precio_unitario: number | null;
  descripcion: string | null;
  valor_actual_nuevo: number | null;
}

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Movimientos</h1>
          <div class="subtitle">Ingresos, gastos y revalorizaciones de inversiones</div>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">＋ Nuevo movimiento</button>
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
          <label>Cuenta</label>
          <select class="select" [(ngModel)]="fCuenta" (ngModelChange)="load()">
            <option [ngValue]="null">Todas</option>
            @for (c of cuentas(); track c.id) { <option [ngValue]="c.id">{{ c.nombre }}</option> }
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
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
            <option value="revalorizacion">Revalorización</option>
          </select>
        </div>
        <div class="field">
          <label>Desde</label>
          <input class="input" type="date" [(ngModel)]="fDesde" (ngModelChange)="load()" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input class="input" type="date" [(ngModel)]="fHasta" (ngModelChange)="load()" />
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button class="btn" (click)="clearFilters()">Limpiar filtros</button>
        </div>
      </div>

      <!-- Resumen -->
      @if (!loading() && movimientos().length) {
        <div class="chip-row" style="margin-bottom:16px">
          <span class="badge badge-primary">Ingresos: {{ fmt(totalIngresos()) }}</span>
          <span class="badge badge-danger">Gastos: {{ fmt(totalGastos()) }}</span>
          <span class="badge badge-accent">Revalorización neta: {{ fmt(totalReval()) }}</span>
          <span class="badge">{{ movimientos().length }} movimientos</span>
        </div>
      }

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (movimientos().length === 0) {
        <div class="card empty-state">
          <div class="icon">💸</div>
          <p>No hay movimientos que coincidan.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Persona</th><th>Cuenta</th>
                <th>Instrumento</th><th>Descripción</th><th class="num">Monto</th><th class="actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (m of movimientos(); track m.id) {
                <tr>
                  <td class="muted">
                    {{ fmtFecha(m.fecha) }}
                    <div style="font-size:.78rem">{{ fmtHora(m.fecha) }}</div>
                  </td>
                  <td>
                    <span class="badge"
                      [class.badge-primary]="m.tipo === 'ingreso'"
                      [class.badge-danger]="m.tipo === 'gasto'"
                      [class.badge-accent]="m.tipo === 'revalorizacion'">
                      {{ label(m.tipo) }}
                    </span>
                  </td>
                  <td>{{ m.persona_nombre }}</td>
                  <td>{{ m.cuenta_nombre }}<div class="muted" style="font-size:.78rem">{{ m.institucion_nombre }}</div></td>
                  <td>{{ m.instrumento_nombre || '—' }}</td>
                  <td class="muted" style="max-width:240px">{{ m.descripcion || '—' }}</td>
                  <td class="num" [class.amount-pos]="signed(m) > 0" [class.amount-neg]="signed(m) < 0">
                    {{ (m.divisa_simbolo || '') }} {{ fmt(signed(m)) }}
                  </td>
                  <td class="actions">
                    @if (m.tipo !== 'revalorizacion') {
                      <button class="btn btn-sm btn-ghost" (click)="openEdit(m)">✏️</button>
                    }
                    <button class="btn btn-sm btn-danger" (click)="remove(m)">🗑️</button>
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
            <h2>{{ form().id ? 'Editar movimiento' : 'Nuevo movimiento' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <!-- Tipo selector (solo al crear) -->
            @if (!form().id) {
              <div class="field" style="margin-bottom:18px">
                <label>Tipo de movimiento</label>
                <div class="chip-row">
                  <button class="btn" [class.btn-primary]="form().tipo === 'ingreso'" (click)="setTipo('ingreso')">💰 Ingreso</button>
                  <button class="btn" [class.btn-primary]="form().tipo === 'gasto'" (click)="setTipo('gasto')">🛒 Gasto</button>
                  <button class="btn" [class.btn-primary]="form().tipo === 'revalorizacion'" (click)="setTipo('revalorizacion')">📊 Revalorización</button>
                </div>
              </div>
            }

            <div class="form-grid">
              <!-- Row 1: Fecha y hora (full-width) -->
              <div class="field" style="grid-column:1 / -1">
                <label>Fecha y hora</label>
                <div class="flex gap-8">
                  <input class="input" type="date" [ngModel]="form().fecha" (ngModelChange)="setFecha($event)" style="flex:2" />
                  <input class="input" type="time" [ngModel]="form().hora" (ngModelChange)="setHora($event)" style="flex:1" />
                </div>
              </div>

              <!-- Row 2: Persona | Cuenta -->
              <div class="field">
                <label>Persona</label>
                <select class="select" [ngModel]="form().persona_id" (ngModelChange)="onPersonaChange($event)">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  @for (p of personas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
                </select>
              </div>
              <div class="field">
                <label>Cuenta</label>
                <select class="select" [ngModel]="form().cuenta_id" (ngModelChange)="onCuentaChange($event)">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  @for (c of cuentasFiltradas(); track c.id) { <option [ngValue]="c.id">{{ cuentaLabel(c) }}</option> }
                </select>
              </div>

              <!-- Revalorización -->
              @if (form().tipo === 'revalorizacion') {
                <div class="field" style="grid-column:1 / -1">
                  <label>Divisa</label>
                  <select class="select" [(ngModel)]="form().divisa_id">
                    <option [ngValue]="null" disabled>Selecciona…</option>
                    @for (d of divisas(); track d.id) { <option [ngValue]="d.id">{{ d.codigo }}</option> }
                  </select>
                </div>
                <div class="field" style="grid-column:1 / -1">
                  <div class="card" style="padding:12px 14px; background:var(--surface-2)">
                    <div class="muted" style="font-size:.82rem">Valor actual registrado en la cuenta</div>
                    <div style="font-size:1.2rem; font-weight:700">
                      {{ selectedCuenta() ? (selectedCuenta()!.divisa_simbolo + ' ' + fmt(selectedCuenta()?.valor_actual ?? 0)) : '—' }}
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label>Nuevo valor actual</label>
                  <input class="input" type="number" step="any" [(ngModel)]="form().valor_actual_nuevo" placeholder="0" />
                </div>
                <div class="field">
                  <label>Ajuste calculado</label>
                  <input class="input" [value]="revalPreview()" disabled />
                </div>
              } @else {
                <!-- Row 3: Monto | Divisa -->
                <div class="field">
                  <label>Monto</label>
                  <input class="input" type="number" step="any" [(ngModel)]="form().monto" placeholder="0" />
                </div>
                <div class="field">
                  <label>Divisa</label>
                  <select class="select" [(ngModel)]="form().divisa_id">
                    <option [ngValue]="null" disabled>Selecciona…</option>
                    @for (d of divisas(); track d.id) { <option [ngValue]="d.id">{{ d.codigo }}</option> }
                  </select>
                </div>
                <!-- Row 4: Instrumento (full-width) -->
                <div class="field" style="grid-column:1 / -1">
                  <label>Instrumento (opcional)</label>
                  <select class="select" [(ngModel)]="form().instrumento_id">
                    <option [ngValue]="null">— Ninguno —</option>
                    @for (ins of instrumentos(); track ins.id) { <option [ngValue]="ins.id">{{ ins.nombre }}</option> }
                  </select>
                </div>
                <!-- Row 5: Cantidad | Precio unitario -->
                <div class="field">
                  <label>Cantidad (títulos, opcional)</label>
                  <input class="input" type="number" step="any" [(ngModel)]="form().cantidad" placeholder="0" />
                </div>
                <div class="field">
                  <label>Precio unitario (opcional)</label>
                  <input class="input" type="number" step="any" [(ngModel)]="form().precio_unitario" placeholder="0" />
                </div>
              }

              <!-- Row 6: Descripción (full-width) -->
              <div class="field" style="grid-column:1 / -1">
                <label>Descripción</label>
                <textarea class="textarea" [(ngModel)]="form().descripcion" placeholder="Texto libre"></textarea>
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
export class MovimientosComponent implements OnInit {
  movimientos = signal<Movimiento[]>([]);
  personas = signal<Persona[]>([]);
  cuentas = signal<Cuenta[]>([]);
  divisas = signal<Divisa[]>([]);
  instrumentos = signal<Instrumento[]>([]);
  instituciones = signal<Institucion[]>([]);
  loading = signal(true);
  showForm = signal(false);
  form = signal<MovForm>(this.blank());

  fPersona: number | null = null;
  fCuenta: number | null = null;
  fInstitucion: number | null = null;
  fTipo: string | null = null;
  fDesde: string | null = null;
  fHasta: string | null = null;

  selectedCuenta = computed(() => this.cuentas().find((c) => c.id === this.form().cuenta_id));

  // If a persona is selected, only her cuentas show; otherwise all of them.
  cuentasFiltradas = computed(() => {
    const pid = this.form().persona_id;
    if (pid == null) return this.cuentas();
    return this.cuentas().filter((c) => c.persona_id === pid);
  });

  totalIngresos = computed(() => this.sum('ingreso'));
  totalGastos = computed(() => this.sum('gasto'));
  totalReval = computed(() =>
    this.movimientos().filter((m) => m.tipo === 'revalorizacion').reduce((a, m) => a + Number(m.monto), 0)
  );

  constructor(private api: ApiService) {}

  ngOnInit() {
    forkJoin({
      personas: this.api.getPersonas(),
      cuentas: this.api.getCuentas(),
      divisas: this.api.getDivisas(),
      instrumentos: this.api.getInstrumentos(),
      instituciones: this.api.getInstituciones(),
    }).subscribe(({ personas, cuentas, divisas, instrumentos, instituciones }) => {
      this.personas.set(personas);
      this.cuentas.set(cuentas);
      this.divisas.set(divisas);
      this.instrumentos.set(instrumentos);
      this.instituciones.set(instituciones);
      this.load();
    });
  }

  blank(): MovForm {
    return {
      tipo: 'ingreso', fecha: new Date().toISOString().slice(0, 10), hora: '00:00',
      persona_id: null, cuenta_id: null, monto: null, divisa_id: null,
      instrumento_id: null, cantidad: null, precio_unitario: null,
      descripcion: null, valor_actual_nuevo: null,
    };
  }

  private splitDateTime(dt: string): { fecha: string; hora: string } {
    // Accepts "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM(:SS)?".
    if (dt.includes('T')) return { fecha: dt.slice(0, 10), hora: dt.slice(11, 16) };
    return { fecha: dt, hora: '00:00' };
  }

  private joinDateTime(fecha: string, hora: string): string {
    // "YYYY-MM-DDTHH:MM:00" — always seconds so string comparisons are consistent.
    return `${fecha}T${hora || '00:00'}:00`;
  }

  setFecha(v: string) { this.form.update((f) => ({ ...f, fecha: v })); }
  setHora(v: string) { this.form.update((f) => ({ ...f, hora: v || '00:00' })); }

  load() {
    this.loading.set(true);
    this.api.getMovimientos({
      persona_id: this.fPersona ? [this.fPersona] : undefined,
      cuenta_id: this.fCuenta ? [this.fCuenta] : undefined,
      institucion_id: this.fInstitucion ? [this.fInstitucion] : undefined,
      tipo: this.fTipo ?? undefined,
      fecha_desde: this.fDesde ?? undefined,
      fecha_hasta: this.fHasta ? `${this.fHasta}T23:59:59` : undefined,
    }).subscribe({
      next: (d) => { this.movimientos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clearFilters() {
    this.fPersona = null; this.fCuenta = null; this.fInstitucion = null;
    this.fTipo = null; this.fDesde = null; this.fHasta = null;
    this.load();
  }

  sum(tipo: string): number {
    return this.movimientos().filter((m) => m.tipo === tipo).reduce((a, m) => a + Number(m.monto), 0);
  }

  setTipo(t: string) { this.form.update((f) => ({ ...f, tipo: t })); }

  onCuentaChange(id: number) {
    const cuenta = this.cuentas().find((c) => c.id === id);
    this.form.update((f) => ({
      ...f,
      cuenta_id: id,
      persona_id: cuenta?.persona_id ?? f.persona_id,
      divisa_id: cuenta?.divisa_id ?? f.divisa_id,
    }));
  }

  onPersonaChange(id: number | null) {
    this.form.update((f) => {
      // If the selected cuenta doesn't belong to the new persona, drop it (and its divisa).
      const currentCuenta = this.cuentas().find((c) => c.id === f.cuenta_id);
      const keepCuenta = !currentCuenta || id == null || currentCuenta.persona_id === id;
      return {
        ...f,
        persona_id: id,
        cuenta_id: keepCuenta ? f.cuenta_id : null,
        divisa_id: keepCuenta ? f.divisa_id : null,
      };
    });
  }

  cuentaLabel(c: Cuenta): string {
    // Prefix with persona name only when the persona filter is empty (to disambiguate).
    const prefix = this.form().persona_id == null ? `(${c.persona_nombre}) ` : '';
    return `${prefix}${c.nombre} (${c.divisa_codigo})`;
  }

  revalPreview(): string {
    const f = this.form();
    const cuenta = this.selectedCuenta();
    if (!cuenta || f.valor_actual_nuevo == null) return '—';
    const delta = Number(f.valor_actual_nuevo) - Number(cuenta.valor_actual ?? 0);
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${this.fmt(delta)}`;
  }

  openCreate() { this.form.set(this.blank()); this.showForm.set(true); }

  openEdit(m: Movimiento) {
    const { fecha, hora } = this.splitDateTime(m.fecha);
    this.form.set({
      id: m.id, tipo: m.tipo, fecha, hora, persona_id: m.persona_id, cuenta_id: m.cuenta_id,
      monto: Number(m.monto), divisa_id: m.divisa_id, instrumento_id: m.instrumento_id ?? null,
      cantidad: m.cantidad ?? null, precio_unitario: m.precio_unitario ?? null,
      descripcion: m.descripcion ?? null, valor_actual_nuevo: null,
    });
    this.showForm.set(true);
  }

  close() { this.showForm.set(false); }

  isValid(): boolean {
    const f = this.form();
    if (!f.fecha || !f.persona_id || !f.cuenta_id) return false;
    if (f.tipo === 'revalorizacion') return f.valor_actual_nuevo != null;
    return f.monto != null && !!f.divisa_id;
  }

  save() {
    const f = this.form();
    const fechaCompleta = this.joinDateTime(f.fecha, f.hora);

    if (f.tipo === 'revalorizacion') {
      const payload: RevalorizacionPayload = {
        tipo: 'revalorizacion',
        cuenta_id: f.cuenta_id!,
        valor_actual_nuevo: Number(f.valor_actual_nuevo),
        fecha: fechaCompleta,
        persona_id: f.persona_id!,
        divisa_id: f.divisa_id ?? undefined,
        descripcion: f.descripcion ?? undefined,
      };
      this.api.createMovimiento(payload).subscribe(() => { this.close(); this.reloadAll(); });
      return;
    }

    const mov: Movimiento = {
      fecha: fechaCompleta, persona_id: f.persona_id!, cuenta_id: f.cuenta_id!, tipo: f.tipo,
      monto: Number(f.monto), divisa_id: f.divisa_id!, instrumento_id: f.instrumento_id,
      cantidad: f.cantidad, precio_unitario: f.precio_unitario, descripcion: f.descripcion,
    };
    const req = f.id ? this.api.updateMovimiento(f.id, mov) : this.api.createMovimiento(mov);
    req.subscribe(() => { this.close(); this.load(); });
  }

  remove(m: Movimiento) {
    if (!m.id) return;
    if (!confirm('¿Eliminar este movimiento?')) return;
    this.api.deleteMovimiento(m.id).subscribe(() => this.load());
  }

  // A revaluation changes cuenta.valor_actual, so refresh cuentas too.
  reloadAll() {
    this.api.getCuentas().subscribe((c) => this.cuentas.set(c));
    this.load();
  }

  signed(m: Movimiento): number {
    const v = Number(m.monto);
    return m.tipo === 'gasto' ? -Math.abs(v) : v;
  }

  label(t: string): string {
    return t === 'revalorizacion' ? 'Revalorización' : t.charAt(0).toUpperCase() + t.slice(1);
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtFecha(dt: string): string { return this.splitDateTime(dt).fecha; }
  fmtHora(dt: string): string { return this.splitDateTime(dt).hora; }
}
