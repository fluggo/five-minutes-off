import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeScreenComponent } from './time-screen.component';
import { SideSelectorComponent } from '../side-selector/side-selector.component';
import { SetWeekEntryComponent } from '../set-week-entry/set-week-entry.component';
import { MinutesDisplayPipe } from '../time-off.service';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../toast.component';

describe('TimeScreenComponent', () => {
  let component: TimeScreenComponent;
  let fixture: ComponentFixture<TimeScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TimeScreenComponent,
        SideSelectorComponent,
        SetWeekEntryComponent,
        MinutesDisplayPipe,
      ],
      imports: [
        FormsModule,
        NgbModule.forRoot(),
      ],
      providers: [
        ToastService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
