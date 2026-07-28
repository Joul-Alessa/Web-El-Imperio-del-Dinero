import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Personas</h2>

    <div class="form-row">
      <input [(ngModel)]="newName" placeholder="Nombre de la persona" (keyup.enter)="addUser()" />
      <button (click)="addUser()" [disabled]="!newName.trim()">Añadir</button>
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
                <input [(ngModel)]="editName" (keyup.enter)="saveUser(u.id)" />
                <button (click)="saveUser(u.id)">Guardar</button>
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
  newName = '';
  editName = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  private load() {
    this.api.getUsers().subscribe({
      next: u => this.users = u,
      error: e => console.error('Error al cargar personas', e),
    });
  }

  addUser() {
    if (!this.newName.trim()) return;
    this.api.createUser(this.newName.trim()).subscribe({
      next: () => { this.newName = ''; this.load(); },
      error: e => console.error('Error al crear persona', e),
    });
  }

  startEdit(u: User) { this.editingId = u.id; this.editName = u.name; }

  saveUser(id: number) {
    if (!this.editName.trim()) return;
    this.api.updateUser(id, this.editName.trim()).subscribe({
      next: () => { this.editingId = null; this.load(); },
      error: e => console.error('Error al actualizar persona', e),
    });
  }

  cancelEdit() { this.editingId = null; }

  deleteUser(id: number) {
    if (confirm('¿Eliminar esta persona?')) {
      this.api.deleteUser(id).subscribe({
        next: () => this.load(),
        error: e => console.error('Error al eliminar persona', e),
      });
    }
  }
}
