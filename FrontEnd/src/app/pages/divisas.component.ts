import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Divisa } from '../core/models';

@Component({
  selector: 'app-divisas',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Divisas</h1>
          <div class="subtitle">Monedas usadas en cuentas e instrumentos</div>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">＋ Nueva divisa</button>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (items().length === 0) {
        <div class="card empty-state">
          <div class="icon">💱</div>
          <p>No hay divisas registradas todavía.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr><th style="width:80px">ID</th><th>Código</th><th>Nombre</th><th>Símbolo</th><th class="actions">Acciones</th></tr>
            </thead>
            <tbody>
              @for (d of items(); track d.id) {
                <tr>
                  <td class="muted">#{{ d.id }}</td>
                  <td><span class="badge badge-primary">{{ d.codigo }}</span></td>
                  <td><strong>{{ d.nombre }}</strong></td>
                  <td>{{ d.simbolo }}</td>
                  <td class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="openEdit(d)">✏️ Editar</button>
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
            <h2>{{ editing().id ? 'Editar divisa' : 'Nueva divisa' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field">
                <label>Código</label>
                <input class="input" [(ngModel)]="editing().codigo" placeholder="MXN" maxlength="8" />
              </div>
              <div class="field">
                <label>Símbolo</label>
                <input class="input" [(ngModel)]="editing().simbolo" placeholder="$" maxlength="6" />
              </div>
              <div class="field" style="grid-column: 1 / -1">
                <label>Nombre</label>
                <input class="input" [(ngModel)]="editing().nombre" placeholder="Peso mexicano" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="close()">Cancelar</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!editing().codigo || !editing().nombre || !editing().simbolo">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DivisasComponent implements OnInit {
  items = signal<Divisa[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Divisa>({ codigo: '', nombre: '', simbolo: '' });

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getDivisas().subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() { this.editing.set({ codigo: '', nombre: '', simbolo: '' }); this.showForm.set(true); }
  openEdit(d: Divisa) { this.editing.set({ ...d }); this.showForm.set(true); }
  close() { this.showForm.set(false); }

  save() {
    const d = this.editing();
    const req = d.id ? this.api.updateDivisa(d.id, d) : this.api.createDivisa(d);
    req.subscribe(() => { this.close(); this.load(); });
  }

  remove(d: Divisa) {
    if (!d.id) return;
    if (!confirm(`¿Eliminar "${d.nombre}"?`)) return;
    this.api.deleteDivisa(d.id).subscribe(() => this.load());
  }
}
