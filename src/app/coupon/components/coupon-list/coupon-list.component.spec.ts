import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CouponListComponent } from './coupon-list.component';
import { CouponService } from '../../services/coupon.service';
import { UserService } from '../../../user-security/services/user.service';
import { Coupon } from '../../models/coupon.model';

const mockCoupon: Coupon = {
  id: 1,
  code: 'TEST01',
  title: 'Test Coupon',
  description: 'Description test',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  category: 'CINEMA',
  expirationDate: '2027-01-01T00:00:00',
  maxUsage: 50,
  currentUsage: 10,
  isActive: true,
  imageUrl: '',
  partnerName: 'Test Partner',
  merchantName: null,
  createdAt: '2025-01-01T00:00:00',
  available: true
};

describe('CouponListComponent', () => {
  let component: CouponListComponent;
  let fixture: ComponentFixture<CouponListComponent>;
  let couponServiceSpy: jasmine.SpyObj<CouponService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    couponServiceSpy = jasmine.createSpyObj('CouponService', [
      'getAvailableCoupons', 'getRecommendations', 'getUserCluster', 'claimCoupon'
    ]);
    userServiceSpy = jasmine.createSpyObj('UserService', [], {
      currentUser: jasmine.createSpy().and.returnValue({ id: '42', role: 'USER' })
    });

    couponServiceSpy.getAvailableCoupons.and.returnValue(of([mockCoupon]));
    couponServiceSpy.getRecommendations.and.returnValue(of({ predictions: [] }));
    couponServiceSpy.getUserCluster.and.returnValue(of({ segmentName: '1' }));

    await TestBed.configureTestingModule({
      imports: [CouponListComponent, CommonModule, RouterModule.forRoot([])],
      providers: [
        { provide: CouponService, useValue: couponServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CouponListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load coupons on init', () => {
    expect(couponServiceSpy.getAvailableCoupons).toHaveBeenCalled();
    expect(component.coupons.length).toBe(1);
    expect(component.filteredCoupons.length).toBe(1);
  });

  it('should filter coupons by category', () => {
    component.filterByCategory('CINEMA');
    expect(component.filteredCoupons.length).toBe(1);

    component.filterByCategory('RESTAURANT');
    expect(component.filteredCoupons.length).toBe(0);
  });

  it('should show ALL coupons when category is ALL', () => {
    component.filterByCategory('CINEMA');
    component.filterByCategory('ALL');
    expect(component.filteredCoupons.length).toBe(1);
  });

  it('should resolve userId from userService', () => {
    expect(component.userId).toBe(42);
  });

  it('isAdmin should return false for USER role', () => {
    expect(component.isAdmin).toBeFalse();
  });

  it('should calculate correct days left', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const days = component.getDaysLeft(future.toISOString());
    expect(days).toBeGreaterThanOrEqual(4);
    expect(days).toBeLessThanOrEqual(6);
  });

  it('should return correct category icon', () => {
    expect(component.getCategoryIcon('CINEMA')).toBe('🎬');
    expect(component.getCategoryIcon('FITNESS')).toBe('💪');
    expect(component.getCategoryIcon('UNKNOWN')).toBe('🎁');
  });

  describe('claimCoupon()', () => {
    it('should show success message on successful claim', fakeAsync(() => {
      couponServiceSpy.claimCoupon = jasmine.createSpy().and.returnValue(of({} as any));
      component.claimCoupon(1);
      expect(component.claimedMessage).toContain('ajouté');
      expect(component.claimedMessageType).toBe('success');
      tick(4001);
      expect(component.claimedMessage).toBe('');
    }));

    it('should show warning when coupon already claimed (409)', fakeAsync(() => {
      couponServiceSpy.claimCoupon = jasmine.createSpy().and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'already claimed' } }))
      );
      component.claimCoupon(1);
      expect(component.claimedMessageType).toBe('warning');
      expect(component.claimedMessage).toContain('déjà');
      tick(4001);
    }));

    it('should show service unavailable error when status is 0', fakeAsync(() => {
      couponServiceSpy.claimCoupon = jasmine.createSpy().and.returnValue(
        throwError(() => ({ status: 0, error: null }))
      );
      component.claimCoupon(1);
      expect(component.claimedMessageType).toBe('error');
      expect(component.claimedMessage).toContain('indisponible');
      tick(4001);
    }));

    it('should not call API if userId is 0', () => {
      (userServiceSpy as any).currentUser = jasmine.createSpy().and.returnValue(null);
      component.claimCoupon(1);
      expect(couponServiceSpy.claimCoupon).not.toHaveBeenCalled();
    });
  });

  describe('ML predictions', () => {
    it('should return undefined for coupon with no prediction', () => {
      expect(component.getPrediction(999)).toBeUndefined();
    });

    it('should map predictions by couponId', () => {
      component.predictions.set(1, { couponId: 1, probability: 0.9 });
      const pred = component.getPrediction(1);
      expect(pred?.probability).toBe(0.9);
    });
  });
});
