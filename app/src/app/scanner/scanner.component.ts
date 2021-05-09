import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent implements OnInit {

  constructor(private socket: Socket) {}

  ngOnInit(): void {
    this.socket.on("logs", (text) => {
      console.log(text);
      
    });
  }

  onIsbnKeydown(event: any) {
    this.socket.emit("isbn", event.target.value);
  }

}
