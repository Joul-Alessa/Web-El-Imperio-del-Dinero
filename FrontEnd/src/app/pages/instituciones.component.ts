import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Institucion } from '../core/models';

@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Instituciones</h1>
          <div class="subtitle">Bancos, fintechs, brokers y gobierno</div>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">＋ Nueva institución</button>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (items().length === 0) {
        <div class="card empty-state">
          <div class="icon">🏛️</div>
          <p>No hay instituciones registradas todavía.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr><th style="width:80px">ID</th><th>Nombre</th><th>Tipo</th><th class="actions">Acciones</th></tr>
            </thead>
            <tbody>
              @for (i of items(); track i.id) {
                <tr>
                  <td class="muted">#{{ i.id }}</td>
                  <td><strong>{{ i.nombre }}</strong></td>
                  <td><span class="badge">{{ tipoLabels[i.tipo] || i.tipo }}</span></td>
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
            <h2>{{ editing().id ? 'Editar institución' : 'Nueva institución' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field">
                <label>Nombre</label>
                <input class="input" [(ngModel)]="editing().nombre" placeholder="Ej. BBVA" />
              </div>
              <div class="field">
                <label>Tipo</label>
                <select class="select" [(ngModel)]="editing().tipo">
                  <option [ngValue]="null" disabled>Selecciona…</option>
                  <option value="banco">Banco</option>
                  <option value="fintech">Fintech</option>
                  <option value="broker">Broker</option>
                  <option value="gobierno">Gobierno</option>
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
export class InstitucionesComponent implements OnInit {
  items = signal<Institucion[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Institucion>({ nombre: '', tipo: null as any });

  readonly tipoLabels: Record<string, string> = {
    banco: 'Banco',
    fintech: 'Fintech',
    broker: 'Broker',
    gobierno: 'Gobierno',
  };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getInstituciones().subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() { this.editing.set({ nombre: '', tipo: null as any }); this.showForm.set(true); }
  openEdit(i: Institucion) { this.editing.set({ ...i }); this.showForm.set(true); }
  close() { this.showForm.set(false); }

  save() {
    const i = this.editing();
    const req = i.id ? this.api.updateInstitucion(i.id, i) : this.api.createInstitucion(i);
    req.subscribe(() => { this.close(); this.load(); });
  }

  remove(i: Institucion) {
    if (!i.id) return;
    if (!confirm(`¿Eliminar "${i.nombre}"?`)) return;
    this.api.deleteInstitucion(i.id).subscribe(() => this.load());
  }
}
