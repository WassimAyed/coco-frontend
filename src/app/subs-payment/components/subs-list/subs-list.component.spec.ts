import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubsListComponent } from './subs-list.component';

describe('SubsListComponent', () => {
  let component: SubsListComponent;
  let fixture: ComponentFixture<SubsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
