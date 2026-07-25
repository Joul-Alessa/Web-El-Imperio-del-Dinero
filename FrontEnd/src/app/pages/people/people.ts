import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Personas</h2>

    <div class="form-row">
      <input #nameInput placeholder="Nombre de la persona" />
      <button (click)="addUser(nameInput.value); nameInput.value = ''">Añadir</button>
    </div>

    <table>
      <thead>
        <tr><th>ID</th><th>Nombre</th><th>Creado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (u of users; track u.id) {
          <tr>
            <td>{{ u.id }}</td>
            <td>
              @if (editingId === u.id) {
                <input #editInput [value]="u.name" (keyup.enter)="saveUser(u.id, editInput.value)" />
                <button (click)="saveUser(u.id, editInput.value)">Guardar</button>
                <button (click)="cancelEdit()">Cancelar</button>
              } @else {
                {{ u.name }}
              }
            </td>
            <td>{{ u.createdAt | date }}</td>
            <td>
              <button (click)="startEdit(u)">Editar</button>
              <button (click)="deleteUser(u.id)">Eliminar</button>
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
export class PeopleComponent implements OnInit {
  users: User[] = [];
  editingId: number | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  private load() { this.api.getUsers().subscribe(u => this.users = u); }

  addUser(name: string) {
    if (!name.trim()) return;
    this.api.createUser(name.trim()).subscribe(() => this.load());
  }

  startEdit(u: User) { this.editingId = u.id; }

  saveUser(id: number, name: string) {
    if (!name.trim()) return;
    this.api.updateUser(id, name.trim()).subscribe(() => {
      this.editingId = null;
      this.load();
    });
  }

  cancelEdit() { this.editingId = null; }

  deleteUser(id: number) {
    if (confirm('¿Eliminar esta persona?')) {
      this.api.deleteUser(id).subscribe(() => this.load());
    }
  }
}
