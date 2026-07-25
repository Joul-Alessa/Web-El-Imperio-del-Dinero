import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Institution } from '../../services/api.service';

@Component({
  selector: 'app-institutions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Instituciones</h2>

    <div class="form-row">
      <input #nameInput placeholder="Nombre" />
      <input #iconInput placeholder="Icono (opcional)" />
      <button (click)="add(nameInput.value, iconInput.value); nameInput.value = ''; iconInput.value = ''">Añadir</button>
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
                <input #editInput [value]="item.name" (keyup.enter)="save(item.id, editInput.value)" />
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

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  private load() { this.api.getInstitutions().subscribe(i => this.list = i); }

  add(name: string, icon: string) {
    if (!name.trim()) return;
    this.api.createInstitution(name.trim(), icon.trim() || undefined).subscribe(() => this.load());
  }

  startEdit(item: Institution) { this.editingId = item.id; }

  save(id: number, name: string) {
    if (!name.trim()) return;
    this.api.updateInstitution(id, { name: name.trim() }).subscribe(() => {
      this.editingId = null;
      this.load();
    });
  }

  cancelEdit() { this.editingId = null; }

  remove(id: number) {
    if (confirm('¿Eliminar esta institución?')) {
      this.api.deleteInstitution(id).subscribe(() => this.load());
    }
  }
}
