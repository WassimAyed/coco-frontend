import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubsDetailComponent } from './subs-detail.component';

describe('SubsDetailComponent', () => {
  let component: SubsDetailComponent;
  let fixture: ComponentFixture<SubsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SubsDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
