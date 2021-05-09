import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { ScannerComponent } from './scanner/scanner.component';
import { CaptureComponent } from './capture/capture.component';
const config: SocketIoConfig = { url: '/', options: {} };


@NgModule({
  declarations: [
    AppComponent,
    ScannerComponent,
    CaptureComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
