import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  postLimit: number;
  durationDays: number;
  type: string;
}

export interface Payment {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
  stripePaymentId: string;
}

export interface UserSubscription {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  remainingPosts: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8085';
  private userId = 1; // À remplacer par l'ID utilisateur de l'auth

  constructor(private http: HttpClient) {}

  /**
   * Get all subscription plans
   */
  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/subscriptions`);
  }

  /**
   * Create payment session
   */
  createPaymentSession(planId: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/payments`, null, {
      params: new HttpParams()
        .set('userId', this.userId.toString())
        .set('planId', planId.toString())
    });
  }

  /**
   * Get user's payments
   */
  getUserPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/user/${this.userId}`);
  }

  /**
   * Download invoice
   */
  downloadInvoice(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/invoice`, {
      responseType: 'blob'
    });
  }

  /**
   * Confirm payment session
   */
  confirmPaymentSession(sessionId: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/payments/confirm`, {
      params: new HttpParams().set('sessionId', sessionId)
    });
  }

  /**
   * Get user's subscriptions
   */
  getUserSubscriptions(): Observable<UserSubscription[]> {
    return this.http.get<UserSubscription[]>(`${this.apiUrl}/user-subscriptions/user/${this.userId}`);
  }

  /**
   * Check quota
   */
  checkQuota(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/quota/${this.userId}`);
  }

  /**
   * Get all payments
   */
  getAllPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments`);
  }

  setUserId(userId: number): void {
    this.userId = userId;
  }
}
