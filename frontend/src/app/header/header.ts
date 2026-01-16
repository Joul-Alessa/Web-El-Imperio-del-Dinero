import { Component, inject } from '@angular/core';
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
import { PersonsService } from '../services/persons-service'

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
  isDarkTheme: boolean = false;

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkTheme = true;
      document.documentElement.classList.add('dark-theme');
    }
  }

  toggleTheme() {
  this.isDarkTheme = !this.isDarkTheme;
  
  // Usamos documentElement (la etiqueta <html>)
  const htmlElement = document.documentElement;

  if (this.isDarkTheme) {
    htmlElement.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}

  logIn() {
    const dialogRef = this.dialog.open(DialogLogin);

    dialogRef.afterClosed().subscribe(result => {
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
  persons!: Persons[];
  activePerson: number = parseInt(localStorage.getItem('person') || "0"); 
  oldPerson: number = this.activePerson;

  constructor(private personsService: PersonsService){ }

  ngOnInit(){
    this.personsService.getAll().subscribe({
      next: (datos) => {
        this.persons = datos;
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}