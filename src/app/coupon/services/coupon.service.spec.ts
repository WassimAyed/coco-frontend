import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CouponService } from './coupon.service';
import { Coupon, UserCoupon } from '../models/coupon.model';

describe('CouponService', () => {
  let service: CouponService;
  let httpMock: HttpTestingController;

  const BASE = 'http://localhost:8094/api/coupons';
  const USER_BASE = 'http://localhost:8094/api/user-coupons';

  const mockCoupon: Coupon = {
    id: 1,
    code: 'COCO10',
    title: 'Réduction Campus',
    description: '10% sur la librairie du campus',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    category: 'SHOPPING',
    expirationDate: '2026-12-31T23:59:59',
    maxUsage: 100,
    currentUsage: 5,
    isActive: true,
    imageUrl: '',
    partnerName: 'Librairie Campus',
    merchantName: null,
    createdAt: '2025-01-01T00:00:00',
    available: true
  };

  const mockUserCoupon: UserCoupon = {
    id: 1,
    userId: 42,
    status: 'CLAIMED',
    claimedAt: '2025-04-01T10:00:00',
    usedAt: '',
    couponId: 1,
    couponCode: 'COCO10',
    couponTitle: 'Réduction Campus',
    couponDescription: '10% sur la librairie',
    couponImageUrl: '',
    couponPartnerName: 'Librairie Campus',
    couponCategory: 'SHOPPING',
    couponDiscountType: 'PERCENTAGE',
    couponDiscountValue: 10,
    couponExpirationDate: '2026-12-31T23:59:59'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CouponService]
    });
    service = TestBed.inject(CouponService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCoupons()', () => {
    it('should return list of coupons', () => {
      service.getAllCoupons().subscribe(coupons => {
        expect(coupons.length).toBe(1);
        expect(coupons[0].code).toBe('COCO10');
        expect(coupons[0].discountValue).toBe(10);
      });

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([mockCoupon]);
    });
  });

  describe('getAvailableCoupons()', () => {
    it('should fetch available coupons', () => {
      service.getAvailableCoupons().subscribe(coupons => {
        expect(coupons).toEqual([mockCoupon]);
      });

      const req = httpMock.expectOne(`${BASE}/available`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCoupon]);
    });
  });

  describe('claimCoupon()', () => {
    it('should POST to claim endpoint with correct params', () => {
      service.claimCoupon(1, 42).subscribe(uc => {
        expect(uc.status).toBe('CLAIMED');
        expect(uc.couponId).toBe(1);
      });

      const req = httpMock.expectOne(`${USER_BASE}/claim/1?userId=42`);
      expect(req.request.method).toBe('POST');
      req.flush(mockUserCoupon);
    });

    it('should handle 409 conflict (already claimed)', () => {
      let errorStatus = 0;
      service.claimCoupon(1, 42).subscribe({
        error: (err) => { errorStatus = err.status; }
      });

      const req = httpMock.expectOne(`${USER_BASE}/claim/1?userId=42`);
      req.flush({ message: 'already claimed' }, { status: 409, statusText: 'Conflict' });
      expect(errorStatus).toBe(409);
    });
  });

  describe('getMyCoupons()', () => {
    it('should fetch coupons for a given user', () => {
      service.getMyCoupons(42).subscribe(coupons => {
        expect(coupons).toEqual([mockUserCoupon]);
      });

      const req = httpMock.expectOne(`${USER_BASE}/my?userId=42`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUserCoupon]);
    });
  });

  describe('createCoupon()', () => {
    it('should POST new coupon data', () => {
      const payload = { code: 'NEW01', title: 'Nouveau', discountType: 'FIXED', discountValue: 5 };
      service.createCoupon(payload).subscribe(c => {
        expect(c.code).toBe('COCO10');
      });

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockCoupon);
    });
  });

  describe('updateCoupon()', () => {
    it('should PUT updated coupon data', () => {
      const update = { title: 'Titre modifié' };
      service.updateCoupon(1, update).subscribe(c => {
        expect(c).toEqual(mockCoupon);
      });

      const req = httpMock.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockCoupon);
    });
  });

  describe('deleteCoupon()', () => {
    it('should DELETE coupon by id', () => {
      service.deleteCoupon(1).subscribe();

      const req = httpMock.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('toggleCouponStatus()', () => {
    it('should PATCH toggle status', () => {
      service.toggleCouponStatus(1).subscribe(c => {
        expect(c).toEqual(mockCoupon);
      });

      const req = httpMock.expectOne(`${BASE}/1/toggle`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockCoupon);
    });
  });

  describe('getRecommendations()', () => {
    it('should fetch AI recommendations for user', () => {
      const mockRec = { predictions: [{ couponId: 1, probability: 0.85 }] };
      service.getRecommendations(42).subscribe(res => {
        expect(res.predictions[0].probability).toBe(0.85);
      });

      const req = httpMock.expectOne(`${BASE}/ai/recommend?userId=42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRec);
    });
  });

  describe('getUserCluster()', () => {
    it('should fetch user cluster/segment data', () => {
      const mockCluster = { segmentName: '1', cluster: 1 };
      service.getUserCluster(42).subscribe(res => {
        expect(res.segmentName).toBe('1');
      });

      const req = httpMock.expectOne(`${BASE}/ai/cluster?userId=42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCluster);
    });
  });
});
