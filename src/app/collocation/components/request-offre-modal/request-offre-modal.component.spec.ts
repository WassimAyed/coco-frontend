import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestOffreModalComponent } from './request-offre-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('RequestOffreModalComponent', () => {
  let component: RequestOffreModalComponent;
  let fixture: ComponentFixture<RequestOffreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RequestOffreModalComponent],
      imports: [HttpClientTestingModule, FormsModule]
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
