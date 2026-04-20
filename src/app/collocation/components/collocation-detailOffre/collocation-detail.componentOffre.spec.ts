import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollocationDetailComponent } from './collocation-detailOffre.component';

import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CollocationDetailComponent', () => {
  let component: CollocationDetailComponent;
  let fixture: ComponentFixture<CollocationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollocationDetailComponent],
      imports: [RouterTestingModule, HttpClientTestingModule]
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
