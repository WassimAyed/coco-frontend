import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollocationDetailComponent } from './collocation-detail.component';

describe('CollocationDetailComponent', () => {
  let component: CollocationDetailComponent;
  let fixture: ComponentFixture<CollocationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollocationDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollocationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
