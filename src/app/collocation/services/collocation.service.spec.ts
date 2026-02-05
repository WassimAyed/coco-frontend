import { TestBed } from '@angular/core/testing';

import { CollocationService } from './collocation.service';

describe('CollocationService', () => {
  let service: CollocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
