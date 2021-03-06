import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TimeScreenComponent } from './time-screen/time-screen.component';
import { SideSelectorComponent } from './side-selector/side-selector.component';
import { SetWeekEntryComponent } from './set-week-entry/set-week-entry.component';
import { MinutesDisplayPipe } from './time-off.service';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastComponent } from './toast.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        TimeScreenComponent,
        SideSelectorComponent,
        SetWeekEntryComponent,
        MinutesDisplayPipe,
        ToastComponent,
      ],
      imports: [
        FormsModule,
        NgbModule.forRoot()
      ]
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app');
  }));
/*  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Welcome to five-minutes-off!');
  }));*/
});
