import { Component, OnInit, Injectable } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Observable, timer, Subject } from 'rxjs';
import { tap, debounceTime, publish, debounce } from 'rxjs/operators';

export interface ToastMessage {
  type: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  message: string;
  durationMilliseconds: number;
}

@Injectable()
export class ToastService {
  toastMessages = new Subject<ToastMessage>();

  toast(message: string, type: ToastMessage['type'] = 'primary', durationMilliseconds = 4000): void {
    this.toastMessages.next({ message: message, type: type, durationMilliseconds: durationMilliseconds });
  }

  error(err: any, type: ToastMessage['type'] = 'danger', durationMilliseconds = 4000): void {
    if(!err)
      return;

    if(typeof err.message === 'string')
      return this.toast(err.message, type, durationMilliseconds);

    return this.toast(`${err}`, type, durationMilliseconds);
  }
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  animations: [
    trigger('visibleState', [
      state('in', style({opacity: 1})),
      transition('void => in', [
        style({opacity: 0}),
        animate(200)
      ]),
      transition('in => void', [
        animate(200, style({opacity: 0})),
      ]),
    ])
  ]
})
export class ToastComponent implements OnInit {
  visible: 'in' | 'out' = 'out';
  text = '';
  type = 'alert-primary';

  constructor(private toast: ToastService) { }

  ngOnInit() {
    this.toast.toastMessages.pipe(
      tap(msg => {
        this.text = msg.message;
        this.visible = 'in';
        this.type = `alert-${msg.type}`;
      }),
      debounce(msg => timer(msg.durationMilliseconds)),
      tap(msg => {
        this.visible = 'out';
      }),
    ).subscribe();
  }
}
