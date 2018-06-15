import { Component, ViewChild } from '@angular/core';
import { ToastService } from './toast.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ToastService]
})
export class AppComponent {
  title = 'app';

  constructor() {}
}
