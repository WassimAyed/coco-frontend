import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coupon, UserCoupon } from '../models/coupon.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  // Utilise un port dédié pour le service coupon (8099)
  // distinct du gateway utilisateur (environment.apiBaseUrl = 8090)
  private readonly couponBaseUrl = 'http://localhost:8099/api/coupons';
  private readonly userCouponBaseUrl = 'http://localhost:8099/api/user-coupons';
  private readonly opts = { withCredentials: false };

  constructor(private http: HttpClient) {}

  getAllCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.couponBaseUrl, this.opts);
  }

  getAvailableCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.couponBaseUrl + '/available', this.opts);
  }

  getCouponsByCategory(category: string): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.couponBaseUrl + '/category/' + category, this.opts);
  }

  getCouponById(id: number): Observable<Coupon> {
    return this.http.get<Coupon>(this.couponBaseUrl + '/' + id, this.opts);
  }

  claimCoupon(couponId: number, userId: number): Observable<UserCoupon> {
    return this.http.post<UserCoupon>(
      `${this.userCouponBaseUrl}/claim/${couponId}?userId=${userId}`,
      {},
      this.opts
    );
  }

  useCoupon(couponId: number, userId: number): Observable<UserCoupon> {
    return this.http.post<UserCoupon>(
      `${this.userCouponBaseUrl}/use/${couponId}?userId=${userId}`,
      {},
      this.opts
    );
  }

  getMyCoupons(userId: number): Observable<UserCoupon[]> {
    return this.http.get<UserCoupon[]>(`${this.userCouponBaseUrl}/my?userId=${userId}`, this.opts);
  }

  getMyActiveCoupons(userId: number): Observable<UserCoupon[]> {
    return this.http.get<UserCoupon[]>(`${this.userCouponBaseUrl}/my/active?userId=${userId}`, this.opts);
  }

  countMyActiveCoupons(userId: number): Observable<number> {
    return this.http.get<number>(`${this.userCouponBaseUrl}/my/count?userId=${userId}`, this.opts);
  }

  createCoupon(coupon: any): Observable<Coupon> {
    return this.http.post<Coupon>(this.couponBaseUrl, coupon, this.opts);
  }

  updateCoupon(id: number, coupon: any): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.couponBaseUrl}/${id}`, coupon, this.opts);
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.couponBaseUrl}/${id}`, this.opts);
  }

  analyzeCoupons(): Observable<any> {
    return this.http.get<any>(this.couponBaseUrl + '/ai/analyze', this.opts);
  }

  toggleCouponStatus(id: number): Observable<Coupon> {
    return this.http.patch<Coupon>(`${this.couponBaseUrl}/${id}/toggle`, {}, this.opts);
  }

  // ML Recommendations
  getRecommendations(userId: number): Observable<any> {
    return this.http.get<any>(`${this.couponBaseUrl}/ai/recommend?userId=${userId}`, this.opts);
  }

  getPrediction(userId: number, couponId: number): Observable<any> {
    return this.http.get<any>(`${this.couponBaseUrl}/ai/predict?userId=${userId}&couponId=${couponId}`, this.opts);
  }

  getUserCluster(userId: number): Observable<any> {
    return this.http.get<any>(`${this.couponBaseUrl}/ai/cluster?userId=${userId}`, this.opts);
  }

  getSegments(): Observable<any> {
    return this.http.get<any>(this.couponBaseUrl + '/ai/segments', this.opts);
  }
}