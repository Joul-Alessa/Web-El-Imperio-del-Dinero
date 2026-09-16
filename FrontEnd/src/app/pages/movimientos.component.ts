import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { ApiService } from '../services/api.service';
import {
  Movimiento, Persona, Cuenta, Divisa, Instrumento, Institucion, RevalorizacionPayload,
} from '../core/models';
import { ConfirmModalComponent } from '../shared/confirm-modal.component';

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
  imports: [FormsModule, ConfirmModalComponent],
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
      <div class="card" style="padding:18px; margin-bottom:20px">
        <!-- Búsqueda: renglón propio de ancho completo -->
        <div class="field" style="margin-bottom:14px">
          <label>Buscar en descripción</label>
          <input class="input" type="text" [(ngModel)]="fBusqueda" (ngModelChange)="onBusquedaChange()" placeholder="Texto libre…" />
        </div>
        <!-- Resto de filtros: se acomodan dinámicamente y saltan de renglón si no caben -->
        <div class="filters" style="padding:0; margin:0">
        <div class="field">
          <label>Persona</label>
          <select class="select" [ngModel]="fPersona" (ngModelChange)="onFPersonaChange($event)">
            <option [ngValue]="null">Todas</option>
            @for (p of personas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Cuenta</label>
          <select class="select" [ngModel]="fCuenta" (ngModelChange)="onFCuentaChange($event)">
            <option [ngValue]="null">Todas</option>
            @for (c of cuentasFiltroDisponibles(); track c.id) { <option [ngValue]="c.id">{{ cuentaLabelFiltro(c) }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Institución</label>
          <select class="select" [(ngModel)]="fInstitucion" (ngModelChange)="resetAndLoad()">
            <option [ngValue]="null">Todas</option>
            @for (i of instituciones(); track i.id) { <option [ngValue]="i.id">{{ i.nombre }}</option> }
          </select>
        </div>
        <div class="field">
          <label>Tipo</label>
          <select class="select" [(ngModel)]="fTipo" (ngModelChange)="resetAndLoad()">
            <option [ngValue]="null">Todos</option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </div>
        <div class="field">
          <label>Desde</label>
          <input class="input" type="date" [(ngModel)]="fDesde" (ngModelChange)="resetAndLoad()" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input class="input" type="date" [(ngModel)]="fHasta" (ngModelChange)="resetAndLoad()" />
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button class="btn" (click)="clearFilters()">Limpiar filtros</button>
        </div>
        </div>
      </div>

      <!-- Resumen -->
      @if (!loading() && total()) {
        <div class="chip-row" style="margin-bottom:16px">
          <span class="badge badge-primary">Ingresos: {{ fmt(totalIngresos()) }}</span>
          <span class="badge badge-danger">Gastos: {{ fmt(totalGastos()) }}</span>
          <span class="badge">{{ total() }} movimientos</span>
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
                      [class.badge-danger]="m.tipo === 'gasto'">
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
                    <button class="btn btn-sm btn-ghost" (click)="openEdit(m)">✏️</button>
                    <button class="btn btn-sm btn-danger" (click)="remove(m)">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="flex" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:16px">
          <div class="muted" style="font-size:.85rem">
            Mostrando {{ rangoDesde() }}–{{ rangoHasta() }} de {{ total() }}
          </div>
          <div class="flex" style="align-items:center; flex-wrap:wrap; gap:8px">
            <button class="btn btn-sm" [disabled]="page() <= 1" (click)="goToPage(1)">« Primera</button>
            <button class="btn btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">‹ Anterior</button>
            <select class="select" [ngModel]="page()" (ngModelChange)="goToPage($event)" style="width:auto">
              @for (n of pages(); track n) {
                <option [ngValue]="n">Página {{ n }} de {{ totalPages() }}</option>
              }
            </select>
            <button class="btn btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">Siguiente ›</button>
            <button class="btn btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(totalPages())">Última »</button>
            <select class="select" [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)" style="width:auto">
              @for (s of pageSizeOpciones; track s) {
                <option [ngValue]="s">{{ s }} por página</option>
              }
            </select>
          </div>
        </div>
      }

      <!-- Descargas -->
      <div class="export-bar">
        <button class="btn btn-export" (click)="descargarSqlite()" [disabled]="downloadingSqlite() || downloadingExcel()">
          {{ downloadingSqlite() ? 'Descargando…' : '⬇️ Descargar base de datos (.sqlite3)' }}
        </button>
        <button class="btn btn-export" (click)="descargarExcel()" [disabled]="downloadingSqlite() || downloadingExcel()">
          {{ downloadingExcel() ? 'Generando…' : '📊 Descargar movimientos (.xlsx)' }}
        </button>
      </div>
    </div>

    <app-confirm-modal
      [open]="showConfirm()"
      title="Eliminar movimiento"
      message="¿Eliminar este movimiento?"
      confirmText="Eliminar"
      (onConfirm)="confirmRemove()"
      (onCancel)="showConfirm.set(false)"
    />

    <app-confirm-modal
      [open]="showError()"
      title="Error"
      [message]="errorMsg()"
      confirmText="Aceptar"
      confirmClass="btn-primary"
      (onConfirm)="showError.set(false)"
      (onCancel)="showError.set(false)"
    />

    @if (showForm()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ form().id ? 'Editar movimiento' : 'Nuevo movimiento' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <!-- Tipo selector (Revalorización es un atajo que se guarda como ingreso o gasto) -->
            <div class="field" style="margin-bottom:18px">
              <label>Tipo de movimiento</label>
              <div class="chip-row">
                <button class="btn" [class.btn-primary]="form().tipo === 'ingreso'" (click)="setTipo('ingreso')">💰 Ingreso</button>
                <button class="btn" [class.btn-primary]="form().tipo === 'gasto'" (click)="setTipo('gasto')">🛒 Gasto</button>
                <button class="btn" [class.btn-primary]="form().tipo === 'revalorizacion'" (click)="setTipo('revalorizacion')">📊 Revalorización</button>
              </div>
              @if (form().tipo === 'revalorizacion') {
                <div class="muted" style="font-size:.78rem; margin-top:6px">
                  Atajo: el sistema calculará la diferencia y la guardará como ingreso o gasto.
                </div>
              }
            </div>

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

              <!-- Revalorización (atajo) -->
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
                    <div class="muted" style="font-size:.82rem">
                      Valor actual registrado en la cuenta
                      <span style="font-size:.72rem">(suma de movimientos anteriores a la fecha)</span>
                    </div>
                    <div style="font-size:1.2rem; font-weight:700">
                      @if (!form().cuenta_id) {
                        <span class="muted">Elige una cuenta</span>
                      } @else if (balanceAnterior() === null) {
                        <span class="muted">Calculando…</span>
                      } @else {
                        {{ (selectedCuenta()?.divisa_simbolo ?? '') }} {{ fmt(balanceAnterior() ?? 0) }}
                      }
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label>Nuevo valor actual</label>
                  <input class="input" type="number" step="any" [ngModel]="form().valor_actual_nuevo" (ngModelChange)="onValorActualInput($event)" placeholder="0" />
                </div>
                <div class="field">
                  <label>Ajuste que se registrará</label>
                  <input class="input" [value]="revalPreview()" disabled />
                </div>
                @if (esInversion()) {
                  <div class="field">
                    <label>Cantidad (títulos)</label>
                    <input class="input" type="number" step="any" [ngModel]="form().cantidad" (ngModelChange)="onCantidadInput($event)" placeholder="0" />
                  </div>
                  <div class="field">
                    <label>Precio unitario</label>
                    <input class="input" type="number" step="any" [ngModel]="form().precio_unitario" (ngModelChange)="onPrecioInput($event)" placeholder="0" />
                  </div>
                  @if (autoCalcHint()) {
                    <div class="muted" style="grid-column:1 / -1; font-size:.78rem">
                      ⚡ {{ autoCalcHint() }}
                    </div>
                  }
                  <div class="muted" style="grid-column:1 / -1; font-size:.78rem">
                    La cantidad de títulos y el precio unitario representan el total actual al momento del movimiento, no la variación.
                  </div>
                }
              } @else {
                <!-- Row 3: Monto | Divisa -->
                <div class="field">
                  <label>Monto</label>
                  <input class="input" type="number" step="any" min="0" [ngModel]="form().monto" (ngModelChange)="onMontoInput($event)" placeholder="0" />
                </div>
                <div class="field">
                  <label>Divisa</label>
                  <select class="select" [(ngModel)]="form().divisa_id">
                    <option [ngValue]="null" disabled>Selecciona…</option>
                    @for (d of divisas(); track d.id) { <option [ngValue]="d.id">{{ d.codigo }}</option> }
                  </select>
                </div>
                <!-- Balance posterior (informativo) -->
                <div class="field" style="grid-column:1 / -1">
                  <div class="card" style="padding:12px 14px; background:var(--surface-2)">
                    <div class="muted" style="font-size:.82rem">
                      Valor de la cuenta tras el movimiento
                    </div>
                    <div style="font-size:1.2rem; font-weight:700">
                      @if (!form().cuenta_id) {
                        <span class="muted">Elige una cuenta</span>
                      } @else if (balancePosterior() === null) {
                        <span class="muted">Calculando…</span>
                      } @else {
                        {{ (selectedCuenta()?.divisa_simbolo ?? '') }} {{ fmt(balancePosterior()!) }}
                      }
                    </div>
                  </div>
                </div>
                @if (esInversion()) {
                  <!-- Instrumento -->
                  <div class="field" style="grid-column:1 / -1">
                    <label>Instrumento (opcional)</label>
                    <select class="select" [(ngModel)]="form().instrumento_id">
                      <option [ngValue]="null">— Ninguno —</option>
                      @for (ins of instrumentos(); track ins.id) { <option [ngValue]="ins.id">{{ ins.nombre }}</option> }
                    </select>
                  </div>
                  <!-- Cantidad | Precio unitario -->
                  <div class="field">
                    <label>Cantidad (títulos)</label>
                    <input class="input" type="number" step="any" [ngModel]="form().cantidad" (ngModelChange)="onCantidadInput($event)" placeholder="0" />
                  </div>
                  <div class="field">
                    <label>Precio unitario</label>
                    <input class="input" type="number" step="any" [ngModel]="form().precio_unitario" (ngModelChange)="onPrecioInput($event)" placeholder="0" />
                  </div>
                  @if (autoCalcHint()) {
                    <div class="muted" style="grid-column:1 / -1; font-size:.78rem">
                      ⚡ {{ autoCalcHint() }}
                    </div>
                  }
                  <div class="muted" style="grid-column:1 / -1; font-size:.78rem">
                    La cantidad de títulos y el precio unitario representan el total actual al momento del movimiento, no la variación.
                  </div>
                }
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
  downloadingSqlite = signal(false);
  downloadingExcel = signal(false);
  showForm = signal(false);
  form = signal<MovForm>(this.blank());

  showConfirm = signal(false);
  pendingDelete = signal<Movimiento | null>(null);
  showError = signal(false);
  errorMsg = signal('');

  fPersona: number | null = null;
  fCuenta: number | null = null;
  fInstitucion: number | null = null;
  fTipo: string | null = null;
  fDesde: string | null = null;
  fHasta: string | null = null;
  fBusqueda: string = '';
  private busquedaTimer: any = null;

  // Paginación
  page = signal(1);
  pageSize = signal(50);
  total = signal(0);
  pageSizeOpciones = [25, 50, 100, 200];

  // Totales de ingresos/gastos sobre TODO el conjunto filtrado (backend).
  totalIngresos = signal(0);
  totalGastos = signal(0);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  rangoDesde = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  rangoHasta = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  selectedCuenta = computed(() => this.cuentas().find((c) => c.id === this.form().cuenta_id));

  esInversion = computed(() => this.selectedCuenta()?.tipo === 'inversión');

  // If a persona is selected, only her cuentas show; otherwise all of them.
  // Only active accounts are offered, but the currently-selected one is always
  // kept visible so editing a movement on an inactive account still works.
  cuentasFiltradas = computed(() => {
    const pid = this.form().persona_id;
    const selid = this.form().cuenta_id;
    let list = this.cuentas().filter((c) => c.activo !== 0 || (selid != null && c.id === selid));
    if (pid != null) list = list.filter((c) => c.persona_id === pid);
    return list;
  });

  // Balance of the selected cuenta before the form's fecha+hora, fetched from
  // the backend. `null` while pending or before a cuenta is chosen.
  balanceAnterior = signal<number | null>(null);

  private lastAutoField = signal<'valor_actual_nuevo' | 'cantidad' | 'precio_unitario' | null>(null);

  private autoCalcLabels: Record<string, string> = {
    valor_actual_nuevo: 'Nuevo valor actual',
    cantidad: 'Cantidad',
    precio_unitario: 'Precio unitario',
  };

  autoCalcHint = computed(() => {
    const field = this.lastAutoField();
    if (!field || !this.esInversion()) return null;
    return `${this.autoCalcLabels[field]} calculado automáticamente — edítalo para desactivar`;
  });

  balancePosterior = computed(() => {
    const f = this.form();
    const ba = this.balanceAnterior();
    if (ba === null || f.tipo === 'revalorizacion') return null;
    if (f.monto == null) return ba;
    return f.tipo === 'gasto' ? ba - Math.abs(Number(f.monto)) : ba + Number(f.monto);
  });

  constructor(private api: ApiService) {
    effect(() => {
      const f = this.form();
      if (!f.cuenta_id || !f.fecha) {
        this.balanceAnterior.set(null);
        return;
      }
      const fechaCompleta = this.joinDateTime(f.fecha, f.hora);
      this.balanceAnterior.set(null);
      this.api.getCuentaBalance(f.cuenta_id, fechaCompleta, f.id)
        .subscribe({
          next: (r) => this.balanceAnterior.set(r.balance),
          error: () => this.balanceAnterior.set(null),
        });
    });
  }

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
      tipo: 'ingreso', fecha: this.hoyLocal(), hora: '00:00',
      persona_id: null, cuenta_id: null, monto: null, divisa_id: null,
      instrumento_id: null, cantidad: null, precio_unitario: null,
      descripcion: null, valor_actual_nuevo: null,
    };
  }

  // Fecha de HOY en horario local en formato YYYY-MM-DD. Se evita
  // toISOString() porque devuelve UTC y adelanta el día en husos negativos.
  private hoyLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
    this.api.getMovimientosPaginado({
      persona_id: this.fPersona ? [this.fPersona] : undefined,
      cuenta_id: this.fCuenta ? [this.fCuenta] : undefined,
      institucion_id: this.fInstitucion ? [this.fInstitucion] : undefined,
      tipo: this.fTipo ?? undefined,
      fecha_desde: this.fDesde ?? undefined,
      fecha_hasta: this.fHasta ? `${this.fHasta}T23:59:59` : undefined,
      busqueda: this.fBusqueda.trim() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    }).subscribe({
      next: (r) => {
        this.movimientos.set(r.data);
        this.total.set(r.total);
        this.totalIngresos.set(r.totalIngresos);
        this.totalGastos.set(r.totalGastos);
        // Si la página actual quedó fuera de rango (p.ej. tras borrar), reajusta.
        if (this.page() > this.totalPages()) {
          this.page.set(this.totalPages());
          this.load();
          return;
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // Recarga desde la primera página (para cualquier cambio de filtro).
  resetAndLoad() {
    this.page.set(1);
    this.load();
  }

  onBusquedaChange() {
    // Debounce para no lanzar una consulta por cada tecla.
    if (this.busquedaTimer) clearTimeout(this.busquedaTimer);
    this.busquedaTimer = setTimeout(() => this.resetAndLoad(), 350);
  }

  goToPage(n: number) {
    const target = Math.min(Math.max(1, n || 1), this.totalPages());
    if (target === this.page()) return;
    this.page.set(target);
    this.load();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(Number(size) || 50);
    this.resetAndLoad();
  }

  clearFilters() {
    this.fPersona = null; this.fCuenta = null; this.fInstitucion = null;
    this.fTipo = null; this.fDesde = null; this.fHasta = null; this.fBusqueda = '';
    this.resetAndLoad();
  }

  // Filtro: cuentas visibles en el select "Cuenta". Si hay persona filtrada,
  // solo sus cuentas; si "Todas", todas.
  cuentasFiltroDisponibles(): Cuenta[] {
    if (this.fPersona == null) return this.cuentas();
    return this.cuentas().filter((c) => c.persona_id === this.fPersona);
  }

  // Prefijo (persona) solo cuando el filtro de persona está en "Todas".
  cuentaLabelFiltro(c: Cuenta): string {
    const prefix = this.fPersona == null ? `(${c.persona_nombre}) ` : '';
    return `${prefix}${c.nombre}`;
  }

  onFPersonaChange(id: number | null) {
    this.fPersona = id;
    // Si la cuenta seleccionada no pertenece a la nueva persona, limpiar.
    if (this.fCuenta != null && id != null) {
      const cuenta = this.cuentas().find((c) => c.id === this.fCuenta);
      if (cuenta && cuenta.persona_id !== id) this.fCuenta = null;
    }
    this.resetAndLoad();
  }

  onFCuentaChange(id: number | null) {
    this.fCuenta = id;
    if (id != null) {
      const cuenta = this.cuentas().find((c) => c.id === id);
      if (cuenta) this.fPersona = cuenta.persona_id;
    }
    this.resetAndLoad();
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

    const f = this.form();
    if (cuenta?.tipo === 'inversión' && !f.id) {
      this.lastAutoField.set(null);
      this.api.getUltimoMovInversion(id).subscribe((r) => {
        if (r.cantidad != null || r.precio_unitario != null) {
          this.form.update((ff) => ({
            ...ff,
            cantidad: r.cantidad,
            precio_unitario: r.precio_unitario,
          }));
        }
      });
    }
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

  onMontoInput(val: number | null) {
    this.form.update((f) => ({ ...f, monto: val }));
    this.autoCalcWithTotal('monto');
  }

  onValorActualInput(val: number | null) {
    this.form.update((f) => ({ ...f, valor_actual_nuevo: val }));
    this.autoCalcThreeWay('valor_actual_nuevo');
  }

  onCantidadInput(val: number | null) {
    this.form.update((f) => ({ ...f, cantidad: val }));
    if (this.form().tipo === 'revalorizacion') {
      this.autoCalcThreeWay('cantidad');
    } else {
      this.autoCalcWithTotal('cantidad');
    }
  }

  onPrecioInput(val: number | null) {
    this.form.update((f) => ({ ...f, precio_unitario: val }));
    if (this.form().tipo === 'revalorizacion') {
      this.autoCalcThreeWay('precio_unitario');
    } else {
      this.autoCalcWithTotal('precio_unitario');
    }
  }

  private autoCalcThreeWay(changed: 'valor_actual_nuevo' | 'cantidad' | 'precio_unitario') {
    if (!this.esInversion()) return;

    if (changed === this.lastAutoField()) {
      this.lastAutoField.set(null);
      return;
    }

    const f = this.form();
    type F = 'valor_actual_nuevo' | 'cantidad' | 'precio_unitario';
    const fields: F[] = ['valor_actual_nuevo', 'cantidad', 'precio_unitario'];
    const current = this.lastAutoField();
    let target: F | null = current && current !== changed ? current as F : null;

    if (!target) {
      const filled = fields.filter((k) => f[k] != null);
      if (filled.length === 2) {
        target = fields.find((k) => !filled.includes(k)) ?? null;
      }
    }

    if (!target) return;

    const v = f.valor_actual_nuevo, c = f.cantidad, p = f.precio_unitario;
    let val: number | null = null;

    if (target === 'valor_actual_nuevo' && c != null && p != null) {
      val = c * p;
    } else if (target === 'cantidad' && v != null && p != null && p !== 0) {
      val = v / p;
    } else if (target === 'precio_unitario' && v != null && c != null && c !== 0) {
      val = v / c;
    }

    if (val == null) return;

    this.lastAutoField.set(target);
    this.form.update((ff) => ({ ...ff, [target]: val }));
  }

  private autoCalcWithTotal(changed: 'monto' | 'cantidad' | 'precio_unitario') {
    if (!this.esInversion() || this.form().tipo === 'revalorizacion') return;

    if (changed === this.lastAutoField()) {
      this.lastAutoField.set(null);
      return;
    }

    const total = this.balancePosterior();
    if (total == null) return;

    const current = this.lastAutoField();
    const f = this.form();
    const c = f.cantidad, p = f.precio_unitario;

    let target: 'cantidad' | 'precio_unitario' | null = null;

    if (current === 'cantidad' || current === 'precio_unitario') {
      target = current;
    } else if (c != null && p == null) {
      target = 'precio_unitario';
    } else if (p != null && c == null) {
      target = 'cantidad';
    }

    if (!target) return;

    let val: number | null = null;
    if (target === 'cantidad' && p != null && p !== 0) {
      val = total / p;
    } else if (target === 'precio_unitario' && c != null && c !== 0) {
      val = total / c;
    }

    if (val == null) return;

    this.lastAutoField.set(target);
    this.form.update((ff) => ({ ...ff, [target]: val }));
  }

  cuentaLabel(c: Cuenta): string {
    // Prefix with persona name only when the persona filter is empty (to disambiguate).
    const prefix = this.form().persona_id == null ? `(${c.persona_nombre}) ` : '';
    return `${prefix}${c.nombre} (${c.divisa_codigo})`;
  }

  revalPreview(): string {
    const f = this.form();
    const balance = this.balanceAnterior();
    if (balance === null || f.valor_actual_nuevo == null) return '—';
    const delta = Number(f.valor_actual_nuevo) - balance;
    if (delta === 0) return '± 0 (sin cambio)';
    return `${delta > 0 ? 'Ingreso ' : 'Gasto '}${this.fmt(Math.abs(delta))}`;
  }

  openCreate() { this.lastAutoField.set(null); this.form.set(this.blank()); this.showForm.set(true); }

  openEdit(m: Movimiento) {
    this.lastAutoField.set(null);
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
    // Ingreso/gasto: monto positivo obligatorio (negativos no aplican).
    return f.monto != null && Number(f.monto) > 0 && !!f.divisa_id;
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
        cantidad: f.cantidad,
        precio_unitario: f.precio_unitario,
      };
      const req$ = f.id
        ? this.api.updateMovimiento(f.id, payload)
        : this.api.createMovimiento(payload);
      req$.subscribe({
        next: () => { this.close(); this.load(); },
        error: (err) => {
          this.errorMsg.set(err?.error?.error ?? 'No se pudo guardar la revalorización.');
          this.showError.set(true);
        },
      });
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
    this.pendingDelete.set(m);
    this.showConfirm.set(true);
  }

  confirmRemove() {
    const m = this.pendingDelete();
    this.showConfirm.set(false);
    if (m?.id) this.api.deleteMovimiento(m.id).subscribe(() => this.load());
  }

  // ---------- Descargas ----------
  // La DB original solo se lee (el backend sirve un snapshot vía VACUUM INTO):
  // descargar no puede corromperla, con o sin Docker.

  descargarSqlite() {
    if (this.downloadingSqlite()) return;
    this.downloadingSqlite.set(true);
    this.api.downloadRespaldoSqlite().subscribe({
      next: (blob) => {
        this.downloadingSqlite.set(false);
        this.triggerBlobDownload(blob, `imperio_del_dinero_${this.hoyLocal()}.sqlite3`, 'application/x-sqlite3');
      },
      error: () => {
        this.downloadingSqlite.set(false);
        this.errorMsg.set('No se pudo descargar el respaldo SQLite.');
        this.showError.set(true);
      },
    });
  }

  descargarExcel() {
    if (this.downloadingExcel()) return;
    this.downloadingExcel.set(true);
    // Respeta los filtros actuales (sin paginación: se exporta todo lo filtrado).
    this.api.getMovimientos({
      persona_id: this.fPersona ? [this.fPersona] : undefined,
      cuenta_id: this.fCuenta ? [this.fCuenta] : undefined,
      institucion_id: this.fInstitucion ? [this.fInstitucion] : undefined,
      tipo: this.fTipo ?? undefined,
      fecha_desde: this.fDesde ?? undefined,
      fecha_hasta: this.fHasta ? `${this.fHasta}T23:59:59` : undefined,
      busqueda: this.fBusqueda.trim() || undefined,
    }).subscribe({
      next: (rows) => {
        this.downloadingExcel.set(false);
        try {
          const data = rows.map((m) => ({
            'Fecha y hora': this.fmtFechaHoraExcel(m.fecha),
            'Persona': m.persona_nombre ?? '',
            'Tipo de movimiento': this.label(m.tipo),
            'Cuenta': m.cuenta_nombre ?? '',
            'Descripción': m.descripcion ?? '',
            'Monto': Math.abs(Number(m.monto)),
            'Divisa': m.divisa_codigo ?? '',
          }));
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 20 }, { wch: 22 }, { wch: 18 },
            { wch: 24 }, { wch: 40 }, { wch: 14 }, { wch: 8 },
          ];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
          XLSX.writeFile(wb, `movimientos_${this.timestampLocal()}.xlsx`);
        } catch {
          this.errorMsg.set('No se pudo generar el archivo Excel.');
          this.showError.set(true);
        }
      },
      error: () => {
        this.downloadingExcel.set(false);
        this.errorMsg.set('No se pudo obtener los movimientos para exportar.');
        this.showError.set(true);
      },
    });
  }

  private triggerBlobDownload(blob: Blob, filename: string, mime: string) {
    const typed = blob.type ? blob : new Blob([blob], { type: mime });
    const url = URL.createObjectURL(typed);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private timestampLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  }

  signed(m: Movimiento): number {
    const v = Number(m.monto);
    return m.tipo === 'gasto' ? -Math.abs(v) : v;
  }

  label(t: string): string {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtFecha(dt: string): string { return this.splitDateTime(dt).fecha; }
  fmtHora(dt: string): string { return this.splitDateTime(dt).hora; }

  // "YYYY-MM-DDTHH:MM(:SS)?" (o "YYYY-MM-DD") → "DD-MM-AAAA HH:MM:SS".
  fmtFechaHoraExcel(dt: string): string {
    let fecha = dt;
    let hora = '00:00:00';
    if (dt.includes('T')) {
      fecha = dt.slice(0, 10);
      hora = dt.slice(11, 19);
      if (hora.length === 5) hora += ':00';
    }
    const [y, mo, d] = fecha.split('-');
    return `${d}-${mo}-${y} ${hora}`;
  }
}
