import { Component, OnInit, Injector } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TimeOffService, TimeOffMockService, Child, dateAsWeek, weekAsDate, WeekRecord, offsetWeek } from '../time-off.service';
import { NewTimeEntryDialogComponent } from '../new-time-entry-dialog/new-time-entry-dialog.component';
import { interval } from 'rxjs';
import { ToastService } from '../toast.component';

@Component({
  selector: 'app-time-screen',
  templateUrl: './time-screen.component.html',
  styleUrls: ['./time-screen.component.css'],
  providers: [
    { provide: TimeOffService, useClass: TimeOffMockService }
  ],
})
export class TimeScreenComponent implements OnInit {
  children: Child[] = [];
  currentChildIndex = 0;
  currentChild: Child | undefined;
  currentWeek: string;
  loading: boolean;
  weekRecord: WeekRecord | undefined;
  minutesRemaining: number;

  constructor(private modalService: NgbModal, private timeOff: TimeOffService, private toast: ToastService, private injector: Injector) {
    if(timeOff instanceof TimeOffMockService)
      timeOff.randomDelay = 500;
  }

  ngOnInit() {
    this.changeChild(0);

    this.currentWeek = dateAsWeek(new Date());
    this.changeWeek(0);

    this.timeOff.getAccount().subscribe(
      value => {
        this.children = value.children;
        this.changeChild(0);
      },
      error => {});
  }

  fetchWeek() {
    if(!this.currentChild)
      return;

    // TODO: Dim interface
    this.loading = true;
    const childID = this.currentChild.childID;
    const weekID = this.currentWeek;

    this.timeOff.getWeek(childID, weekID).subscribe(
      week => {
        // Make sure this is still the currently selected item
        if(!this.currentChild || this.currentChild.childID !== childID)
          return;

        if(this.currentWeek !== weekID)
          return;

        this.weekRecord = week;

        if(week)
          this.minutesRemaining = week.changes.reduce<number>((remaining, change) => remaining + change.minutesAdded, week.minutesGranted);
        else
          this.minutesRemaining = 0;
      },
      err => {
      }
    );
  }

  changeChild(diff: number) {
    this.currentChildIndex += diff;

    if(this.children.length === 0) {
      // TODO: Disable display
      this.currentChild = undefined;
      return;
    }

    // Bring into range
    while(this.currentChildIndex < 0)
      this.currentChildIndex += this.children.length;

    while(this.currentChildIndex >= this.children.length)
      this.currentChildIndex -= this.children.length;

    this.currentChild = this.children[this.currentChildIndex];
    this.fetchWeek();
  }

  changeWeek(diff: number) {
    this.currentWeek = offsetWeek(this.currentWeek, diff);
    this.fetchWeek();
  }

  weekStartDate(week: string): Date {
    return weekAsDate(week) || new Date();
  }

  weekEndDate(week: string): Date {
    return new Date(this.weekStartDate(week).valueOf() + 6 * 24 * 60 * 60 * 1000);
  }

  openDialog(minutes: number) {
    if(!this.currentChild)
      return;

    const modalRef = this.modalService.open(NewTimeEntryDialogComponent, { injector: this.injector });
    const dialog = (modalRef.componentInstance as NewTimeEntryDialogComponent);

    dialog.setDefaults(this.currentChild.childID, this.currentWeek, minutes);

    modalRef.result.then(
      () => this.fetchWeek(),
      () => {}
    );
  }
}
