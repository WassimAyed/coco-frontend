import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coupon, UserCoupon } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = 'http://localhost:8094/api/coupons';
  private userCouponUrl = 'http://localhost:8094/api/user-coupons';

  constructor(private http: HttpClient) {}

  getAllCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl);
  }

  getAvailableCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl + '/available');
  }

  getCouponsByCategory(category: string): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl + '/category/' + category);
  }

  getCouponById(id: number): Observable<Coupon> {
    return this.http.get<Coupon>(this.apiUrl + '/' + id);
  }

  claimCoupon(couponId: number, userId: number): Observable<UserCoupon> {
    return this.http.post<UserCoupon>(this.userCouponUrl + '/claim/' + couponId + '?userId=' + userId, {});
  }

  useCoupon(couponId: number, userId: number): Observable<UserCoupon> {
    return this.http.post<UserCoupon>(this.userCouponUrl + '/use/' + couponId + '?userId=' + userId, {});
  }

  getMyCoupons(userId: number): Observable<UserCoupon[]> {
    return this.http.get<UserCoupon[]>(this.userCouponUrl + '/my?userId=' + userId);
  }

  getMyActiveCoupons(userId: number): Observable<UserCoupon[]> {
    return this.http.get<UserCoupon[]>(this.userCouponUrl + '/my/active?userId=' + userId);
  }

  countMyActiveCoupons(userId: number): Observable<number> {
    return this.http.get<number>(this.userCouponUrl + '/my/count?userId=' + userId);
  }

  createCoupon(coupon: any): Observable<Coupon> {
    return this.http.post<Coupon>(this.apiUrl, coupon);
  }

  updateCoupon(id: number, coupon: any): Observable<Coupon> {
    return this.http.put<Coupon>(this.apiUrl + '/' + id, coupon);
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl + '/' + id);
  }


analyzeCoupons(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/ai/analyze');
  }

  toggleCouponStatus(id: number): Observable<Coupon> {
    return this.http.patch<Coupon>(this.apiUrl + '/' + id + '/toggle', {});
  }
  // ML Recommendations
  getRecommendations(userId: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/ai/recommend?userId=' + userId);
  }

  getPrediction(userId: number, couponId: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/ai/predict?userId=' + userId + '&couponId=' + couponId);
  }

  getUserCluster(userId: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/ai/cluster?userId=' + userId);
  }

  getSegments(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/ai/segments');
  }
}