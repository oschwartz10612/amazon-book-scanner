import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css'],
})
export class ScannerComponent implements OnInit {
  @ViewChild('mainInput') input: ElementRef;

  constructor(private socket: Socket) {}

  valuePrefix = 'value_box';
  failPrefix = 'box';
  logData = [];
  currentFailBox: string
  currentValueBox: string
  question: string;
  options: Array<string>;
 
  failSound = new Audio('assets/audio/fail.mp3');
  successSound = new Audio('assets/audio/success.mp3');
  attentionSound = new Audio('assets/audio/attn.mp3');

  ngOnInit(): void {
    this.socket.on('logs', (text: string) => {
      this.logData.push(text);
      console.log(text);
      
    });
    this.socket.on("fail_box_update", (text: string) => {
      this.currentFailBox = text;
    });
    this.socket.on("success_box_update", (text: string) => {
      this.currentValueBox = text;
    });
    this.socket.on('fail_sound', () => {
      this.failSound.play();
    });
    this.socket.on('success_sound', () => {
      this.successSound.play();
    });
    this.socket.on('attn_sound', () => {
      this.attentionSound.play();
    });

    this.socket.on("prompt", (data) => {
      this.question = data.shift();
      this.options = data;
    });

  }

  promptRes(index: number) {
    this.socket.emit('promptRes', index);
    this.question = null;
    this.input.nativeElement.focus();
  }

  onInputKeydown(event: any) {
    const val = event.target.value;
    if (val.startsWith(this.valuePrefix) || val.startsWith(this.failPrefix)) {
      this.socket.emit('set_box', val);
    } else {
      this.socket.emit('isbn', val);
    }
    event.target.value = '';
    this.logData = [];
  }
}
