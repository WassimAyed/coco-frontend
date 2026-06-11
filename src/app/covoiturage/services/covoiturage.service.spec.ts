import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CovoiturageService } from './covoiturage.service';

describe('CovoiturageService', () => {
  let service: CovoiturageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CovoiturageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy(); // simplement: le service existe ?
  });
});
