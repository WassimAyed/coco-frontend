import { TestBed } from '@angular/core/testing';
import { AuthInterceptor } from './auth.interceptor';
import { AuthSessionService } from '../services/auth-session.service';

describe('AuthInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthInterceptor, AuthSessionService],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(AuthInterceptor)).toBeTruthy();
  });
});
