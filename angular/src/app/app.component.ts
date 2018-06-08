import { Component, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewTimeEntryDialogComponent } from './new-time-entry-dialog/new-time-entry-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private modalService: NgbModal) {}

  openDialog(minutes: number) {
    const modalRef = this.modalService.open(NewTimeEntryDialogComponent);
    (modalRef.componentInstance as NewTimeEntryDialogComponent).minutes = minutes;
  }
}
