import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CovoiturageDetailComponent } from './covoiturage-detail.component';

import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CovoiturageDetailComponent', () => {
  let component: CovoiturageDetailComponent;
  let fixture: ComponentFixture<CovoiturageDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CovoiturageDetailComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
