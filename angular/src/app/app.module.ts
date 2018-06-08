import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NewTimeEntryDialogComponent } from './new-time-entry-dialog/new-time-entry-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    NewTimeEntryDialogComponent,
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
