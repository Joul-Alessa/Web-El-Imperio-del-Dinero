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
      <input [(ngModel)]="newName" placeholder="Nombre" />
      <input [(ngModel)]="newIcon" placeholder="Icono (opcional)" />
      <button (click)="add()">Añadir</button>
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
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
  `]
})
export class InstitutionsComponent implements OnInit {
  list: Institution[] = [];
  newName = '';
  newIcon = '';
  editingId: number | null = null;
  editName = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  private load() { this.api.getInstitutions().subscribe(i => this.list = i); }

  add() {
    if (!this.newName.trim()) return;
    this.api.createInstitution(this.newName.trim(), this.newIcon.trim() || undefined).subscribe(() => {
      this.newName = '';
      this.newIcon = '';
      this.load();
    });
  }

  startEdit(item: Institution) { this.editingId = item.id; this.editName = item.name; }

  save(id: number) {
    this.api.updateInstitution(id, { name: this.editName.trim() }).subscribe(() => {
      this.editingId = null;
      this.load();
    });
  }

  remove(id: number) {
    if (confirm('¿Eliminar esta institución?')) {
      this.api.deleteInstitution(id).subscribe(() => this.load());
    }
  }
}
