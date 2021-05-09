import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Socket } from "ngx-socket-io";
import { SoundService } from '../sound.service';

@Component({
  selector: 'app-capture',
  templateUrl: './capture.component.html',
  styleUrls: ['./capture.component.css'],
})
export class CaptureComponent implements OnInit {
  @ViewChild('video') video: ElementRef;

  constructor(private socket: Socket, private sound: SoundService) {}

  canVibrate = 'vibrate' in navigator || 'mozVibrate' in navigator;
  canvas = document.createElement('canvas');

  ngOnInit(): void {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 2048 },
          height: { ideal: 1080 },
          facingMode: 'environment',
        },
        //video: true,
        audio: false,
      })
      .then((stream) => {
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      })
      .catch((err) => {
        console.log('An error occurred: ' + err);
      });
  }

  takePicture() {
    navigator.vibrate(100);

    this.canvas.width = this.video.nativeElement.videoWidth;
    this.canvas.height = this.video.nativeElement.videoHeight;
    this.canvas
      .getContext('2d')
      .drawImage(
        this.video.nativeElement,
        0,
        0,
        this.video.nativeElement.videoWidth,
        this.video.nativeElement.videoHeight
      );

    this.canvas.toBlob((blob) => {
      let fd = new FormData();
      fd.append('image', blob, 'image.png');

      fetch('http://localhost:3200/image', {
        method: 'POST',
        body: fd,
      })
        .then(function (response) {
          console.log('done');
          return response;
        })
        .catch(function (err) {
          console.log(err);
        });
    }, 'image/png');
  }
}
