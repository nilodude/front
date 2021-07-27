import { TestBed } from '@angular/core/testing';

import { MatlabService } from './matlab.service';

describe('MatlabService', () => {
  let service: MatlabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatlabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
