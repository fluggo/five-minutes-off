import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTimeEntryDialogComponent } from './new-time-entry-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../toast.component';
import { TimeOffService, TimeOffMockService } from '../time-off.service';

describe('NewTimeEntryDialogComponent', () => {
  let component: NewTimeEntryDialogComponent;
  let fixture: ComponentFixture<NewTimeEntryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewTimeEntryDialogComponent ],
      imports: [
        ReactiveFormsModule,
        NgbModule.forRoot(),
      ],
      providers: [
        NgbActiveModal,
        ToastService,
        { provide: TimeOffService, useClass: TimeOffMockService },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewTimeEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
