import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CovoiturageDetailComponent } from './covoiturage-detail.component';

describe('CovoiturageDetailComponent', () => {
  let component: CovoiturageDetailComponent;
  let fixture: ComponentFixture<CovoiturageDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CovoiturageDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CovoiturageDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
