import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';
import { SoundService } from '../sound.service';
import printJS from 'print-js';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css'],
})
export class ScannerComponent implements OnInit {
  @ViewChild('mainInput') input: ElementRef;
  @ViewChild('index') index: ElementRef;
  @ViewChild('page') page: ElementRef;

  constructor(private socket: Socket, private sound: SoundService) {}

  valuePrefix = 'value_box';
  failPrefix = 'box';
  logData = [];
  currentFailBox: string
  currentValueBox: string
  question: string;
  options: Array<string>;
  isPrinter = false;

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
    this.socket.on("refresh_logs", () => {
      this.logData = [];
    });

    this.socket.on("prompt", (data) => {
      this.question = data.shift();
      this.options = data;
    });

    this.socket.on("print_id", (data) => {
      printJS(`output/output${data}.pdf`)
    });

    this.socket.on("print_fnsku_vals_update", (data) => {
      this.index.nativeElement.value = data.index;
      this.page.nativeElement.value = data.page;
    });

    this.socket.emit('id_global');
  }

  promptRes(index: number) {
    console.log(index);
    
    this.socket.emit('promptRes', index);
    this.question = null;
    this.input.nativeElement.focus();
  }

  onInputKeydown(event: any) {
    const val = event.target.value;

    if (this.isPrinter) {
      this.socket.emit('print_fnsku', val);
    } else {
      if (val.startsWith(this.valuePrefix) || val.startsWith(this.failPrefix)) {
        this.socket.emit('set_box', val);
      } else {
        this.socket.emit('isbn', val);
      }
    }

    event.target.value = '';
    this.logData = [];
  }

  usePrinter() {
    this.isPrinter = !this.isPrinter;
  }

  setPrintVals() {
    this.socket.emit('print_fnsku_vals', {index: this.index.nativeElement.value, page: this.page.nativeElement.value});
  }

  getFNSKU() {
    this.socket.emit('get_fnsku');
  }
}
