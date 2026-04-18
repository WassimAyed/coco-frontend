import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SubsService } from './subs.service';

describe('SubsService', () => {
  let service: SubsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SubsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
