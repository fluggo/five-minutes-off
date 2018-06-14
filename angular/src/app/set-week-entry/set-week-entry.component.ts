import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TimeOffService, offsetWeek, minutesToDisplay } from '../time-off.service';
import { Observable, of } from 'rxjs';
import * as rxjs from 'rxjs/operators';

@Component({
  selector: 'app-set-week-entry',
  templateUrl: './set-week-entry.component.html',
  styleUrls: ['./set-week-entry.component.css']
})
export class SetWeekEntryComponent implements OnInit, OnChanges {
  @Input() childID: string;
  @Input() weekID: string;
  timeString = '1:00';

  constructor(private timeOff: TimeOffService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if('childID' in changes || 'weekID' in changes) {
      this.timeOff.getWeek(this.childID, this.weekID).pipe(
        // If we didn't get the current week, try the previous week
        rxjs.switchMap(week => {
          if(!week)
            return this.timeOff.getWeek(this.childID, offsetWeek(this.weekID, -1));

          return of(week);
        }),

        // Grab the minutes granted
        rxjs.map(week => week ? week.minutesGranted : 60),

        // Provide 60 if all else fails
        rxjs.catchError(err => {
          return of(60);
        }),

        rxjs.map(minutesToDisplay)
      ).subscribe(val => {
        this.timeString = val;
      });
    }
  }

}
