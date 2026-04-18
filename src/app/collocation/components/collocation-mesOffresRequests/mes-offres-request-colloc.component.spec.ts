import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { MesOffresRequestsComponent } from './mes-offres-request-colloc.component';
import { CollocationService } from '../../services/collocation.service';
import { UserService } from '../../../user-security/services/user.service';
import { UserApiService } from '../../../user-security/services/user-api.service';

describe('MesOffresRequestsComponent', () => {
  let component: MesOffresRequestsComponent;
  let fixture: ComponentFixture<MesOffresRequestsComponent>;

  const mockCollocationService = {
    getMyOffers: () => of([]),
    getRequestsByOfferIds: () => of([]),
    updateRequestStatus: () => of({}),
    deleteRequest: () => of({})
  };

  const mockUserService = {
    currentUser: () => ({ id: '123' })
  };

  const mockUserApiService = {
    getUserById: () => Promise.resolve({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MesOffresRequestsComponent], // Use declarations instead of imports
      imports: [CommonModule], // Add CommonModule for *ngIf, *ngFor
      providers: [
        { provide: CollocationService, useValue: mockCollocationService },
        { provide: UserService, useValue: mockUserService },
        { provide: UserApiService, useValue: mockUserApiService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesOffresRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
