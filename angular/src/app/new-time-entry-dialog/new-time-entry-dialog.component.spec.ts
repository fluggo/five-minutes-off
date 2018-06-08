import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTimeEntryDialogComponent } from './new-time-entry-dialog.component';

describe('NewTimeEntryDialogComponent', () => {
  let component: NewTimeEntryDialogComponent;
  let fixture: ComponentFixture<NewTimeEntryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewTimeEntryDialogComponent ]
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
