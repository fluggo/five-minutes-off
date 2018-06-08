import { TestBed, inject } from '@angular/core/testing';

import { TimeOffService } from './time-off.service';

describe('TimeOffService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimeOffService]
    });
  });

  it('should be created', inject([TimeOffService], (service: TimeOffService) => {
    expect(service).toBeTruthy();
  }));
});
