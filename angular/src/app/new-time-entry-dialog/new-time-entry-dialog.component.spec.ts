import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTimeEntryDialogComponent } from './new-time-entry-dialog.component';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('NewTimeEntryDialogComponent', () => {
  let component: NewTimeEntryDialogComponent;
  let fixture: ComponentFixture<NewTimeEntryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewTimeEntryDialogComponent ],
      imports: [
        FormsModule,
        NgbModule.forRoot(),
      ],
      providers: [
        NgbActiveModal
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
