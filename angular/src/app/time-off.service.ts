import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as d3timeFormat from 'd3-time-format';
import { Pipe, PipeTransform } from '@angular/core';
import { delay } from 'rxjs/operators';

@Pipe({ name: 'minutesDisplay' })
export class MinutesDisplayPipe implements PipeTransform {
  transform(value: number): string {
    return minutesToDisplay(value);
  }
}

export function minutesToDisplay(value: number): string {
  const minutes = Math.floor(value) % 60;
  const hours = Math.floor(value / 60);

  const minutesStr = minutes.toFixed(0);

  return `${hours.toFixed(0)}:${minutesStr.length === 1 ? '0' : ''}${minutesStr}`;
}

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
  weekID: string;

  /** Number of minutes initially granted. */
  minutesGranted: number;

  /** Changes made for this week. */
  changes: TimeRecord[];
}

export interface Child {
  name: string;
  childID: string;
}

export interface AccountRecord {
  children: Child[];
}

export const weekAsDate = d3timeFormat.utcParse('%Y-W%V');
export const dateAsWeek = d3timeFormat.utcFormat('%Y-W%V');

@Injectable()
export abstract class TimeOffService {
  /**
   * Adds or removes time.
   * @param weekID ISO 8601 week (e.g. "2018-W03").
   * @param minutes Minutes added (or removed). Cannot be zero.
   * @param reason Reason for the addition or removal. Cannot be empty.
   */
  abstract addTime(childID: string, weekID: string, minutes: number, reason: string): Observable<{}>;

  abstract getAccount(): Observable<AccountRecord>;

  abstract getWeek(childID: string, weekID: string): Observable<WeekRecord | undefined>;

  abstract setWeek(childID: string, weekID: string, minutesGranted: number): Observable<WeekRecord>;

  abstract getRecentReasons(childID: string, positive: boolean, from: number, size: number): Observable<string[]>;
}

interface RecentReason {
  positive: boolean;
  reason: string;
  count: number;
}

/**
 * Offsets the given week by a given number of weeks.
 * @param weekID Week ID to adjust (e.g. 2018-W02).
 * @param offset Weeks to go forward (or negative to go back).
 */
export function offsetWeek(weekID: string, offset: number): string {
  let date = weekAsDate(weekID);

  if(!date)
    return weekID;

  date = new Date(date.valueOf() + offset * 7 * 24 * 60 * 60 * 1000);
  return dateAsWeek(date);
}

@Injectable()
export class TimeOffMockService extends TimeOffService {
  randomDelay = 0;
  recentReasons: RecentReason[];
  weeks: Map<string, WeekRecord> = new Map();
  children: Child[] = [
    { name: 'Luke', childID: '100012022' },
    { name: 'Leia', childID: '317298' }
  ];

  constructor() {
    super();
    this.recentReasons = [
      { positive: false, reason: 'Not listening', count: 10 },
      { positive: false, reason: 'Picked nose', count: 5 },
      { positive: true, reason: 'Brushed teeth without being told', count: 6 },
    ];

    const defaultWeekID = this.getCombinedWeekID('100012022', dateAsWeek(new Date()));

    this.weeks.set(defaultWeekID, {
      weekID: defaultWeekID,
      minutesGranted: 300,
      changes: [
        { minutesAdded: -100, reason: 'Blew up the death star', time: new Date() }
      ]
    });
  }

  getAccount(): Observable<AccountRecord> {
    return of({ children: this.children }).pipe(delay(Math.random() * this.randomDelay));
  }

  getCombinedWeekID(childID: string, weekID: string) {
    return `${childID}\0${weekID}`;
  }

  getRecentReasons(childID: string, positive: boolean, from: number, size: number): Observable<string[]> {
    if(from < 0 || size <= 0)
      return throwError({ message: 'From or size parameters invalid.' });

    return of(
      this.recentReasons.filter(r => r.positive === positive)
        .slice(from, from + size)
        .map(r => r.reason)
    ).pipe(delay(Math.random() * this.randomDelay));
  }

  addTime(childID: string, weekID: string, minutes: number, reason: string): Observable<{}> {
    // Ensure week is valid
    if(!weekAsDate(weekID))
      return throwError({ message: 'Invalid week specifier.' });

    const combinedID = this.getCombinedWeekID(childID, weekID);

    minutes = Math.floor(minutes);
    reason = reason.trim();

    if(minutes === 0)
      return throwError({ message: 'Minutes cannot be zero.' });

    if(reason === '')
      return throwError({ message: 'Reason cannot be empty.' });

    const week = this.weeks.get(combinedID);

    if(!week)
      return throwError({ message: 'Week has not been set up yet.' });

    // Ensure we don't go negative
    const minutesLeft = week.changes.reduce<number>((count, record) => count + record.minutesAdded, week.minutesGranted);

    if(minutesLeft + minutes < 0)
      return throwError({ message: `Cannot take away ${-minutes} minutes with only ${minutesLeft} minutes remaining.` });

    // Checks done, make the change happen
    week.changes.push({ reason: reason, minutesAdded: minutes, time: new Date() });

    // Update the recently used reason list
    this.addReason(reason, minutes > 0);

    return of({}).pipe(delay(Math.random() * this.randomDelay));
  }

  private addReason(reason: string, positive: boolean) {
    let recentReason = this.recentReasons.find(r => r.reason === reason && r.positive === positive);

    if(!recentReason) {
      recentReason = { positive: positive, reason: reason, count: 0 };
      this.recentReasons.push(recentReason);
    }

    recentReason.count++;
    this.recentReasons.sort((a, b) => (a.count > b.count) ? -1 : ((a.count < b.count) ? 1 : 0));
  }

  setWeek(childID: string, weekID: string, minutesGranted: number): Observable<WeekRecord> {
    minutesGranted = Math.floor(minutesGranted);

    if(minutesGranted < 0)
      return throwError({ message: `Can't grant less than zero minutes.` });

    // Ensure week is valid
    if(!weekAsDate(weekID))
      return throwError({ message: 'Invalid week specifier.' });

    const combinedID = this.getCombinedWeekID(childID, weekID);
    let week = this.weeks.get(combinedID);

    if(!week) {
      week = { weekID: weekID, minutesGranted: minutesGranted, changes: [] };
      this.weeks.set(combinedID, week);
    }

    // Ensure we don't go negative
    const minutesLeft = week.changes.reduce<number>((count, record) => count + record.minutesAdded, minutesGranted);

    if(minutesLeft < 0)
      return throwError({ message: `Granting that much time for the week would put the total time for the week less than zero.` });

    week.minutesGranted = minutesGranted;
    return of(week).pipe(delay(Math.random() * this.randomDelay));
  }

  getWeek(childID: string, weekID: string): Observable<WeekRecord | undefined> {
    // Ensure week is valid
    if(!weekAsDate(weekID))
      return throwError({ message: 'Invalid week specifier.' });

    return new Observable<WeekRecord | undefined>(sub => {
      const combinedID = this.getCombinedWeekID(childID, weekID);
      const week = this.weeks.get(combinedID);

      sub.next(week);
      sub.complete();
    }).pipe(delay(Math.random() * this.randomDelay));
  }
}
