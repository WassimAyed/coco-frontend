import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CovoiturageListComponent } from './covoiturage-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('CovoiturageListComponent', () => {
  let component: CovoiturageListComponent;
  let fixture: ComponentFixture<CovoiturageListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CovoiturageListComponent],
      imports: [HttpClientTestingModule, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CovoiturageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
