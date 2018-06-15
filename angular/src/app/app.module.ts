import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NewTimeEntryDialogComponent } from './new-time-entry-dialog/new-time-entry-dialog.component';
import { SideSelectorComponent } from './side-selector/side-selector.component';
import { TimeOffService, TimeOffMockService, MinutesDisplayPipe } from './time-off.service';
import { TimeScreenComponent } from './time-screen/time-screen.component';
import { SetWeekEntryComponent } from './set-week-entry/set-week-entry.component';
import { ToastComponent } from './toast.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    NewTimeEntryDialogComponent,
    SideSelectorComponent,
    TimeScreenComponent,
    MinutesDisplayPipe,
    SetWeekEntryComponent,
    ToastComponent,
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
  ],
  entryComponents: [
    NewTimeEntryDialogComponent,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
