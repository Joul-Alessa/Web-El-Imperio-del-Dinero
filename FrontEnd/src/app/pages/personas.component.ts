import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Persona } from '../core/models';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Personas</h1>
          <div class="subtitle">Miembros de la familia registrados</div>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">＋ Nueva persona</button>
      </div>

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (personas().length === 0) {
        <div class="card empty-state">
          <div class="icon">👤</div>
          <p>No hay personas registradas todavía.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr><th style="width:80px">ID</th><th>Nombre</th><th class="actions">Acciones</th></tr>
            </thead>
            <tbody>
              @for (p of personas(); track p.id) {
                <tr>
                  <td class="muted">#{{ p.id }}</td>
                  <td><strong>{{ p.nombre }}</strong></td>
                  <td class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="openEdit(p)">✏️ Editar</button>
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
            <h2>{{ editing().id ? 'Editar persona' : 'Nueva persona' }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="close()">✕</button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Nombre</label>
              <input class="input" [(ngModel)]="editing().nombre" placeholder="Ej. Kirby" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="close()">Cancelar</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!editing().nombre">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PersonasComponent implements OnInit {
  personas = signal<Persona[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Persona>({ nombre: '' });

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getPersonas().subscribe({
      next: (d) => { this.personas.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() { this.editing.set({ nombre: '' }); this.showForm.set(true); }
  openEdit(p: Persona) { this.editing.set({ ...p }); this.showForm.set(true); }
  close() { this.showForm.set(false); }

  save() {
    const p = this.editing();
    const req = p.id ? this.api.updatePersona(p.id, p) : this.api.createPersona(p);
    req.subscribe(() => { this.close(); this.load(); });
  }

  remove(p: Persona) {
    if (!p.id) return;
    if (!confirm(`¿Eliminar a "${p.nombre}"?`)) return;
    this.api.deletePersona(p.id).subscribe(() => this.load());
  }
}
