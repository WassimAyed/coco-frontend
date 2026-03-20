import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollocationListComponent } from './collocation-list.component';

describe('CollocationListComponent', () => {
  let component: CollocationListComponent;
  let fixture: ComponentFixture<CollocationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollocationListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollocationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
