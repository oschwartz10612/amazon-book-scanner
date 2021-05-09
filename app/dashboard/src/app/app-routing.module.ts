import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CaptureComponent } from './capture/capture.component';
import { ScannerComponent } from './scanner/scanner.component';

const routes: Routes = [
  { path: 'scan', component: ScannerComponent },
  { path: 'capture', component: CaptureComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
