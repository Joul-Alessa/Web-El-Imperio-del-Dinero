import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="onCancel.emit()">
        <div class="modal" style="max-width:420px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ title() }}</h2>
            <button class="btn btn-icon btn-ghost" (click)="onCancel.emit()">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin:0">{{ message() }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="onCancel.emit()">Cancelar</button>
            <button class="btn" [class]="confirmClass()" (click)="onConfirm.emit()">{{ confirmText() }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  open = input(false);
  title = input('Confirmar');
  message = input('');
  confirmText = input('Aceptar');
  confirmClass = input('btn-danger');

  onConfirm = output<void>();
  onCancel = output<void>();
}
