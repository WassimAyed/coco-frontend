import { TestBed } from '@angular/core/testing';

import { CovoiturageService } from './covoiturage.service';

describe('CovoiturageService', () => {
  let service: CovoiturageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CovoiturageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
