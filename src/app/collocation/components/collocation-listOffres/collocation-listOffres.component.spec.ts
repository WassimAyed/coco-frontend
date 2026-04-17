import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollocationListComponent } from './collocation-listOffres.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

describe('CollocationListComponent', () => {
  let component: CollocationListComponent;
  let fixture: ComponentFixture<CollocationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollocationListComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule]
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
