import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Institution } from '../../services/api.service';

@Component({
  selector: 'app-institutions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Instituciones</h2>

    <div class="form-row">
      <input [(ngModel)]="newName" placeholder="Nombre" (keyup.enter)="add()" />
      <input [(ngModel)]="newIcon" placeholder="Icono (opcional)" />
      <button (click)="add()" [disabled]="!newName.trim()">Añadir</button>
    </div>

    <table>
      <thead>
        <tr><th>ID</th><th>Nombre</th><th>Icono</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (item of list; track item.id) {
          <tr>
            <td>{{ item.id }}</td>
            <td>
              @if (editingId === item.id) {
                <input [(ngModel)]="editName" (keyup.enter)="save(item.id)" />
                <button (click)="save(item.id)">Guardar</button>
                <button (click)="cancelEdit()">Cancelar</button>
              } @else {
                {{ item.name }}
              }
            </td>
            <td>{{ item.icon }}</td>
            <td>
              <button (click)="startEdit(item)">Editar</button>
              <button (click)="remove(item.id)">Eliminar</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    .form-row { display: flex; gap: 8px; margin-bottom: 16px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color); }
  `]
})
export class InstitutionsComponent implements OnInit {
  list: Institution[] = [];
  editingId: number | null = null;
  newName = '';
  newIcon = '';
  editName = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  private load() {
    this.api.getInstitutions().subscribe({
      next: i => this.list = i,
      error: e => console.error('Error al cargar instituciones', e),
    });
  }

  add() {
    if (!this.newName.trim()) return;
    this.api.createInstitution(this.newName.trim(), this.newIcon.trim() || undefined).subscribe({
      next: () => { this.newName = ''; this.newIcon = ''; this.load(); },
      error: e => console.error('Error al crear institución', e),
    });
  }

  startEdit(item: Institution) { this.editingId = item.id; this.editName = item.name; }

  save(id: number) {
    if (!this.editName.trim()) return;
    this.api.updateInstitution(id, { name: this.editName.trim() }).subscribe({
      next: () => { this.editingId = null; this.load(); },
      error: e => console.error('Error al actualizar institución', e),
    });
  }

  cancelEdit() { this.editingId = null; }

  remove(id: number) {
    if (confirm('¿Eliminar esta institución?')) {
      this.api.deleteInstitution(id).subscribe({
        next: () => this.load(),
        error: e => console.error('Error al eliminar institución', e),
      });
    }
  }
}
