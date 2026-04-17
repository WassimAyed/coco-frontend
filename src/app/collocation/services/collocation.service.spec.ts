import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CollocationService } from './collocation.service';

describe('CollocationService', () => {
  let service: CollocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CollocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
