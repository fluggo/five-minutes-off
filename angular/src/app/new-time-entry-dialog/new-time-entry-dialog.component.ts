import { Component, OnInit, Input, ViewChild, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgForm } from '@angular/forms';
import { ToastService } from '../toast.component';
import { TimeOffService } from '../time-off.service';

@Component({
  selector: 'app-new-time-entry-dialog',
  templateUrl: './new-time-entry-dialog.component.html',
  styleUrls: ['./new-time-entry-dialog.component.css']
})
export class NewTimeEntryDialogComponent implements OnInit, AfterViewInit, OnChanges {
  childID: string;
  minutes = -5;
  @ViewChild('reasonInput') reasonInput: ElementRef;
  @ViewChild('form') form: NgForm;
  recentReasons: string[] = [];

  constructor(public activeModal: NgbActiveModal, private toast: ToastService, private timeOff: TimeOffService) {}

  ngOnInit() {
    this.reloadRecentReasons();
  }

  ngAfterViewInit() {
    // Put focus on reason text entry
    this.reasonInput.nativeElement.focus();
  }

  ngOnChanges(changes: SimpleChanges) {
      console.log(changes);
    if('minutes' in changes) {
      const change = changes['minutes'];
      console.log(change);

      if(!change.firstChange) {
        console.log(change.previousValue, change.currentValue);
        if((change.previousValue > 0) !== (change.currentValue > 0))
          this.reloadRecentReasons();
      }
    }
  }

  reloadRecentReasons() {
    this.timeOff.getRecentReasons(this.childID, this.minutes > 0, 0, 10).subscribe(
      list => {
        this.recentReasons = list;
      },
      err => {
        this.toast.error(err);
        this.recentReasons = [];
      }
    );
  }

  submit() {
    if(!this.form.valid) {
      this.toast.toast('Please check your submission again.', 'warning');
      return;
    }
  }
}
