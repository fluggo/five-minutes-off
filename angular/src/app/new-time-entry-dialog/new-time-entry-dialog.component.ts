import { Component, OnInit, Input, ViewChild, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl } from '@angular/forms';
import { ToastService } from '../toast.component';
import { TimeOffService } from '../time-off.service';
import { tap, map } from 'rxjs/operators';

@Component({
  selector: 'app-new-time-entry-dialog',
  templateUrl: './new-time-entry-dialog.component.html',
  styleUrls: ['./new-time-entry-dialog.component.css']
})
export class NewTimeEntryDialogComponent implements OnInit, AfterViewInit, OnChanges {
  childID: string;
  weekID: string;
  @ViewChild('reasonInput') reasonInput: ElementRef;
  recentReasons: string[] = [];
  timeEntryForm: FormGroup;
  lastMinutes: number;

  constructor(public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private toast: ToastService,
    private timeOff: TimeOffService) {

    this.timeEntryForm = formBuilder.group({
      minutes: ['', Validators.compose([Validators.required, Validators.pattern(/^[-+]?\d+$/)])],
      reason: ['', Validators.required]
    });
  }

  setDefaults(childID: string, weekID: string, minutes: number) {
    this.childID = childID;
    this.weekID = weekID;
    this.lastMinutes = minutes;
    this.timeEntryForm.patchValue({
      minutes: `${minutes}`
    });
    this.reloadRecentReasons();
  }

  get minutesInput(): AbstractControl {
    const result = this.timeEntryForm.get('minutes');

    if(!result)
      throw new Error('Failed assertion');

    return result;
  }

  ngOnInit() {
    this.minutesInput.valueChanges.pipe(
      map(value => parseInt(value, 10)),
      tap(value => {
        if((value > 0) !== (this.lastMinutes > 0)) {
          this.lastMinutes = value;
          this.reloadRecentReasons();
        }

        this.lastMinutes = value;
      })
    ).subscribe();
  }

  setReason(reason: string) {
    this.timeEntryForm.patchValue({
      reason: reason
    });
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
    this.timeOff.getRecentReasons(this.childID, this.lastMinutes > 0, 0, 10).subscribe(
      list => {
        this.recentReasons = list;
      },
      err => {
        this.toast.error('Failed to get the recent reasons.', err);
        this.recentReasons = [];
      }
    );
  }

  submit() {
    if(!this.timeEntryForm.valid) {
      this.toast.toast('Please check your submission again.', 'warning');
      return;
    }

    const result = this.timeEntryForm.value as { minutes: string, reason: string };

    this.timeOff.addTime(this.childID, this.weekID, +result.minutes, result.reason ).subscribe(
      () => this.activeModal.close(),
      err => this.toast.error('Failed to add time.', err)
    );
  }
}
