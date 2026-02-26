import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesOffresRequestCollocComponent } from './mes-offres-request-colloc.component';

describe('MesOffresRequestCollocComponent', () => {
  let component: MesOffresRequestCollocComponent;
  let fixture: ComponentFixture<MesOffresRequestCollocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesOffresRequestCollocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesOffresRequestCollocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
