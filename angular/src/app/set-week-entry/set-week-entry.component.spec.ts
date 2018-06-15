import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetWeekEntryComponent } from './set-week-entry.component';
import { TimeOffService, TimeOffMockService, dateAsWeek } from '../time-off.service';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ToastService } from '../toast.component';

@Component({
  template: '<app-set-week-entry [childID]="childID" [weekID]="weekID"></app-set-week-entry>'
})
class TestHostComponent {
  childID: string;
  weekID: string;
}

describe('SetWeekEntryComponent', () => {
  let component: SetWeekEntryComponent;
  let parentComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestHostComponent, SetWeekEntryComponent ],
      providers: [
        ToastService,
        { provide: TimeOffService, useClass: TimeOffMockService }
      ],
      imports: [
        FormsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    parentComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.directive(SetWeekEntryComponent)).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update when the weekID changes', async () => {
    // Pick Luke's current week, which should have '5:00' as the time
    parentComponent.weekID = dateAsWeek(new Date());
    parentComponent.childID = '100012022';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.timeString).toEqual('5:00');

    // Now on to an undefined week
    parentComponent.weekID = '2017-W03';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.timeString).toEqual('1:00');
  });
});
