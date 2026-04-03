import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestOffreModalComponent } from './request-offre-modal.component';

describe('RequestOffreModalComponent', () => {
  let component: RequestOffreModalComponent;
  let fixture: ComponentFixture<RequestOffreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestOffreModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestOffreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
