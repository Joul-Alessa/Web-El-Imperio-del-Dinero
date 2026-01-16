import { Component, inject, model, signal } from '@angular/core';
import { Persons } from '../persons';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';

export interface DialogData {
  persons: Persons[];
  activePerson: number;
}

@Component({
  selector: 'app-header',
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  readonly dialog = inject(MatDialog);

  logIn() {
    const dialogRef = this.dialog.open(DialogLogin);

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result !== undefined) {
        localStorage.setItem("person",result)
      }
    });
  }

}


@Component({
  selector: 'dialog-login',
  templateUrl: 'dialog-login.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose, 
    MatSelectModule
  ],
})
export class DialogLogin {
  readonly dialogRef = inject(MatDialogRef<DialogLogin>);
  persons: Persons[] = [{id:1,nombre:"Alex"},{id:2,nombre:"Pep"},{id:3,nombre:"Mamá"},{id:4,nombre:"Papá"}];
  activePerson: number = parseInt(localStorage.getItem('person') || "0"); 

  onNoClick(): void {
    this.dialogRef.close();
  }
}