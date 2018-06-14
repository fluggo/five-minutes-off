import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideSelectorComponent } from './side-selector.component';

describe('SideSelectorComponent', () => {
  let component: SideSelectorComponent;
  let fixture: ComponentFixture<SideSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
