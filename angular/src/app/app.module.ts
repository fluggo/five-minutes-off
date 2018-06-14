import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NewTimeEntryDialogComponent } from './new-time-entry-dialog/new-time-entry-dialog.component';
import { SideSelectorComponent } from './side-selector/side-selector.component';
import { TimeOffService, TimeOffMockService } from './time-off.service';
import { TimeScreenComponent } from './time-screen/time-screen.component';
import { Pipe, PipeTransform } from '@angular/core';
import { SetWeekEntryComponent } from './set-week-entry/set-week-entry.component';

@Pipe({ name: 'minutesDisplay' })
export class MinutesDisplayPipe implements PipeTransform {
  transform(value: number): string {
    const minutes = Math.floor(value) % 60;
    const hours = Math.floor(value / 60);

    const minutesStr = minutes.toFixed(0);

    return `${hours.toFixed(0)}:${minutesStr.length === 1 ? '0' : ''}${minutesStr}`;
  }
}

@NgModule({
  declarations: [
    AppComponent,
    NewTimeEntryDialogComponent,
    SideSelectorComponent,
    TimeScreenComponent,
    MinutesDisplayPipe,
    SetWeekEntryComponent,
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    FormsModule,
  ],
  entryComponents: [
    NewTimeEntryDialogComponent,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
