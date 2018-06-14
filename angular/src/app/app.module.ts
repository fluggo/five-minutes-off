import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NewTimeEntryDialogComponent } from './new-time-entry-dialog/new-time-entry-dialog.component';
import { SideSelectorComponent } from './side-selector/side-selector.component';
import { TimeOffService, TimeOffMockService, MinutesDisplayPipe } from './time-off.service';
import { TimeScreenComponent } from './time-screen/time-screen.component';
import { SetWeekEntryComponent } from './set-week-entry/set-week-entry.component';

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
