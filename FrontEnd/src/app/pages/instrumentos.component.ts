import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Instrumento, Divisa, Institucion } from '../core/models';

@Component({
  selector: 'app-instrumentos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Instrumentos financieros</h1>
          <div class="subtitle">Activos: renta fija, renta variable y ETFs</div>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">＋ Nuevo instrumento</button>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (items().length === 0) {
        <div class="card empty-state">
          <div class="icon">📈</div>
          <p>No hay instrumentos registrados todavía.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th style="width:70px">ID</th><th>Nombre</th><th>Tipo</th>
                <th>Riesgo</th><th>Divisa base</th><th>Institución</th><th class="actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (i of items(); track i.id) {
                <tr>
                  <td class="muted">#{{ i.id }}</td>
                  <td><strong>{{ i.nombre }}</strong></td>
                  <td><span class="badge">{{ label(i.tipo) }}</span></td>
                  <td>
                    @if (i.riesgo) { <span class="badge" [class.badge-danger]="i.riesgo === 'alto'" [class.badge-accent]="i.riesgo === 'medio'">{{ label(i.riesgo) }}</span> }
                    @else { <span class="muted">—</span> }
                  </td>
                  <td>{{ i.divisa_codigo || '—' }}</td>
                  <td>{{ i.institucion_nombre || '—' }}</td>
                  <td class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="openEdit(i)">✏️ Editar</button>
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
            <h2>{{ editing().id ? 'Editar instrumento' : 'Nuevo instrumento' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field" style="grid-column: 1 / -1">
                <label>Nombre</label>
                <input class="input" [(ngModel)]="editing().nombre" placeholder="Ej. NVIDIA, CETES, VOO" />
              </div>
              <div class="field">
                <label>Tipo</label>
                <select class="select" [(ngModel)]="editing().tipo">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  <option value="renta fija">Renta fija</option>
                  <option value="renta variable">Renta variable</option>
                  <option value="ETF">ETF</option>
                </select>
              </div>
              <div class="field">
                <label>Riesgo</label>
                <select class="select" [(ngModel)]="editing().riesgo">
                  <option [ngValue]="null">— Sin especificar —</option>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
              <div class="field">
                <label>Divisa base</label>
                <select class="select" [(ngModel)]="editing().divisa_base_id">
                  <option [ngValue]="null">— Sin especificar —</option>
                  @for (d of divisas(); track d.id) {
                    <option [ngValue]="d.id">{{ d.codigo }} — {{ d.nombre }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Institución</label>
                <select class="select" [(ngModel)]="editing().institucion_id">
                  <option [ngValue]="null">— Ninguna —</option>
                  @for (inst of instituciones(); track inst.id) {
                    <option [ngValue]="inst.id">{{ inst.nombre }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="close()">Cancelar</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!editing().nombre || !editing().tipo">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class InstrumentosComponent implements OnInit {
  items = signal<Instrumento[]>([]);
  divisas = signal<Divisa[]>([]);
  instituciones = signal<Institucion[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Instrumento>(this.blank());

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  blank(): Instrumento {
    return { nombre: '', tipo: null as any, riesgo: null, divisa_base_id: null, institucion_id: null };
  }

  load() {
    this.loading.set(true);
    forkJoin({
      instrumentos: this.api.getInstrumentos(),
      divisas: this.api.getDivisas(),
      instituciones: this.api.getInstituciones(),
    }).subscribe({
      next: ({ instrumentos, divisas, instituciones }) => {
        this.items.set(instrumentos);
        this.divisas.set(divisas);
        this.instituciones.set(instituciones);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() { this.editing.set(this.blank()); this.showForm.set(true); }
  openEdit(i: Instrumento) { this.editing.set({ ...i }); this.showForm.set(true); }
  close() { this.showForm.set(false); }

  save() {
    const i = this.editing();
    const req = i.id ? this.api.updateInstrumento(i.id, i) : this.api.createInstrumento(i);
    req.subscribe(() => { this.close(); this.load(); });
  }

  label(t: string): string {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  remove(i: Instrumento) {
    if (!i.id) return;
    if (!confirm(`¿Eliminar "${i.nombre}"?`)) return;
    this.api.deleteInstrumento(i.id).subscribe(() => this.load());
  }
}
