import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-new-time-entry-dialog',
  templateUrl: './new-time-entry-dialog.component.html',
  styleUrls: ['./new-time-entry-dialog.component.css']
})
export class NewTimeEntryDialogComponent {
  @Input() minutes = -5;

  constructor(public activeModal: NgbActiveModal) {}
}
