import { Injectable } from '@angular/core';
import { Socket } from "ngx-socket-io";

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  failSound = new Audio('assets/audio/fail.mp3');
  successSound = new Audio('assets/audio/success.mp3');
  attentionSound = new Audio('assets/audio/attn.mp3');

  constructor(private socket: Socket) {

    this.socket.on('fail_sound', () => {
      this.failSound.play();
    });
    this.socket.on('success_sound', () => {
      this.successSound.play();
    });
    this.socket.on('attn_sound', () => {
      this.attentionSound.play();
    });
   }


}
