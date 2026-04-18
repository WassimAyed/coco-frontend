import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubsDetailComponent } from './subs-detail.component';

import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SubsDetailComponent', () => {
  let component: SubsDetailComponent;
  let fixture: ComponentFixture<SubsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubsDetailComponent, RouterTestingModule, HttpClientTestingModule]
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
