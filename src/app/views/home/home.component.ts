import { NameDialogComponent } from './../../shared/name-dialog/name-dialog.component';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as signalR from '@microsoft/signalr';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Message {
  userName: string;
  text: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  messages: Message[] = [];
  messageControl = new FormControl('');
  userName!: string;
  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:7150/chat')
    .build();
  constructor(public dialog: MatDialog, public snackbar: MatSnackBar) {
    this.openDialog();
  }
  ngOnInit(): void {}
  openDialog() {
    const dialogRef = this.dialog.open(NameDialogComponent, {
      width: '250px',
      data: this.userName,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.userName = result;
      this.startConnection();
      this.openSnackBar(result);
    });
  }
  openSnackBar(userName: string) {
    const message =
      userName == this.userName
        ? 'Você entrou na sala'
        : `${userName} acabou de entrar`;
    this.snackbar.open(message, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
  startConnection() {
    this.connection.on('newMessage', (userName: string, text: string) => {
      this.messages.push({
        text: text,
        userName: userName,
      });
    });
    this.connection.on('newUser', (userName: string) => {
      this.openSnackBar(userName);
    });
    this.connection.on('previousMessages', (messages: Message[]) => {
      this.messages = messages;
    });
    this.connection.start().then(() => {
      this.connection.send(
        'newUser',
        this.userName,
        this.connection.connectionId
      );
    });
  }
  sendMessage() {
    this.connection
      .send('newMessage', this.userName, this.messageControl.value)
      .then(() => {
        this.messageControl.setValue('');
      });
  }
}
