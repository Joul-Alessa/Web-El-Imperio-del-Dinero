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
      <input [(ngModel)]="newName" placeholder="Nombre de la persona" />
      <button (click)="addUser()">Añadir</button>
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
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    button { margin-left: 4px; }
  `]
})
export class PeopleComponent implements OnInit {
  users: User[] = [];
  newName = '';
  editingId: number | null = null;
  editName = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  private load() { this.api.getUsers().subscribe(u => this.users = u); }

  addUser() {
    if (!this.newName.trim()) return;
    this.api.createUser(this.newName.trim()).subscribe(() => {
      this.newName = '';
      this.load();
    });
  }

  startEdit(u: User) {
    this.editingId = u.id;
    this.editName = u.name;
  }

  saveUser(id: number) {
    this.api.updateUser(id, this.editName.trim()).subscribe(() => {
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
