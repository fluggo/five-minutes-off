import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as d3timeFormat from 'd3-time-format';

export interface TimeRecord {
  /** Number of minutes added (or removed). Cannot be zero. */
  minutesAdded: number;

  /** The reason for the addition or removal. Cannot be empty. */
  reason: string;

  /** The date the infraction took place. */
  time: Date;
}

export interface WeekRecord {
  /** ISO 8601 week (e.g. "2018-W03"). */
  weekId: string;

  /** Number of minutes initially granted. */
  minutesGranted: number;

  /** Changes made for this week. */
  changes: TimeRecord[];
}

const isoWeekParser = d3timeFormat.timeParse('%Y-W%V');

@Injectable()
export abstract class TimeOffService {
  abstract getRecentReasons(from: number, size: number): Observable<string[]>;

  /**
   * Adds or removes time.
   * @param weekId ISO 8601 week (e.g. "2018-W03").
   * @param minutes Minutes added (or removed). Cannot be zero.
   * @param reason Reason for the addition or removal. Cannot be empty.
   */
  abstract addTime(weekId: string, minutes: number, reason: string): Observable<{}>;

  abstract getWeek(weekId: string): Observable<WeekRecord>;

  abstract setWeek(weekId: string, minutesGranted: number): Observable<WeekRecord>;
}

interface RecentReason {
  reason: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class TimeOffMockService {
  recentReasons: RecentReason[];
  weeks: Map<string, WeekRecord>;

  constructor() {
    this.recentReasons = [
      { reason: 'Not listening', count: 1 }
    ];
    this.weeks = new Map();
  }

  getRecentReasons(from: number, size: number): Observable<string[]> {
    if(from < 0 || size <= 0)
      return throwError({ text: 'From or size parameters invalid.' });

    return of(this.recentReasons.slice(from, from + size).map(r => r.reason));
  }

  addTime(weekId: string, minutes: number, reason: string): Observable<{}> {
    // Ensure week is valid
    if(!isoWeekParser(weekId))
      return throwError({ text: 'Invalid week specifier.' });

    minutes = Math.floor(minutes);
    reason = reason.trim();

    if(minutes === 0)
      return throwError({ text: 'Minutes cannot be zero.' });

    if(reason === '')
      return throwError({ text: 'Reason cannot be empty.' });

    const week = this.weeks.get(weekId);

    if(!week)
      return throwError({ text: 'Week has not been set up yet.' });

    // Ensure we don't go negative
    const minutesLeft = week.changes.reduce<number>((count, record) => count + record.minutesAdded, week.minutesGranted);

    if(minutesLeft + minutes < 0)
      return throwError({ text: `Cannot take away ${-minutes} minutes with only ${minutesLeft} minutes remaining.` });

    // Checks done, make the change happen
    week.changes.push({ reason: reason, minutesAdded: minutes, time: new Date() });

    // Update the recently used reason list
    this.addReason(reason);

    return of({});
  }

  private addReason(reason: string) {
    let recentReason = this.recentReasons.find(r => r.reason === reason);

    if(!recentReason) {
      recentReason = { reason: reason, count: 0 };
      this.recentReasons.push(recentReason);
    }

    recentReason.count++;
    this.recentReasons.sort((a, b) => (a.count > b.count) ? -1 : ((a.count < b.count) ? 1 : 0));
  }

  setWeek(weekId: string, minutesGranted: number): Observable<WeekRecord> {
    minutesGranted = Math.floor(minutesGranted);

    if(minutesGranted < 0)
      return throwError({ text: `Can't grant less than zero minutes.` });

    // Ensure week is valid
    if(!isoWeekParser(weekId))
      return throwError({ text: 'Invalid week specifier.' });

    let week = this.weeks.get(weekId);

    if(!week) {
      week = { weekId: weekId, minutesGranted: minutesGranted, changes: [] };
      this.weeks.set(weekId, week);
    }

    // Ensure we don't go negative
    const minutesLeft = week.changes.reduce<number>((count, record) => count + record.minutesAdded, minutesGranted);

    if(minutesLeft < 0)
      return throwError({ text: `Granting that much time for the week would put the total time for the week less than zero.` });

    week.minutesGranted = minutesGranted;
    return of(week);
  }
}
