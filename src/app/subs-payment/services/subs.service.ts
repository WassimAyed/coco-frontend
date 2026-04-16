import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubscriptionPlan, UserSubscription, Payment } from '../models/subscription.model';
import { environment } from '../../../environments/environment';
import { UserService } from '../../user-security/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class SubsService {
  private apiUrl = environment.paymentApiBaseUrl;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) { }

  private resolveCurrentUserId(): number {
    const fromSession = this.userService.currentUser()?.id;
    if (fromSession) {
      return Number(fromSession);
    }

    return Number(localStorage.getItem('userId') || 0);
  }

  private userHeaders(userId?: number): { headers?: HttpHeaders } {
    const effectiveUserId = userId ?? this.resolveCurrentUserId();
    if (!effectiveUserId) return {};
    return {
      headers: new HttpHeaders({
        'X-User-Id': String(effectiveUserId)
      })
    };
  }

  // Gestion des Plans (Admin)
  getAllPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/subscriptions`);
  }

  createPlan(plan: SubscriptionPlan): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(`${this.apiUrl}/subscriptions`, plan);
  }

  updatePlan(id: number, plan: SubscriptionPlan): Observable<SubscriptionPlan> {
    return this.http.put<SubscriptionPlan>(`${this.apiUrl}/subscriptions/${id}`, plan);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subscriptions/${id}`);
  }

  // Abonnements Utilisateurs (Admin)
  getAllUserSubscriptions(): Observable<UserSubscription[]> {
    return this.http.get<UserSubscription[]>(`${this.apiUrl}/user-subscriptions`);
  }

  // Quotas et Abonnements Utilisateur (User)
  getUserQuota(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/quota/${userId}`, this.userHeaders(userId));
  }

  getUserSubscriptions(userId: number): Observable<UserSubscription[]> {
    return this.http.get<UserSubscription[]>(`${this.apiUrl}/user-subscriptions/user/${userId}`, this.userHeaders(userId));
  }

  createUserSubscription(userId: number): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(`${this.apiUrl}/user-subscriptions`, userId, this.userHeaders(userId));
  }

  // Paiement
  initiatePayment(userId: number, planId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/payments`, null, {
      params: { userId, planId },
      headers: this.userHeaders(userId).headers,
      responseType: 'text'
    });
  }

  getUserPayments(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/user/${userId}`, this.userHeaders(userId));
  }

  downloadInvoice(paymentId: number): Observable<Blob> {
    const userId = this.resolveCurrentUserId();
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/invoice`, {
      headers: this.userHeaders(userId).headers,
      responseType: 'blob'
    });
  }

  addBonusPosts(userId: number, amount: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/bonus/${userId}`, null, {
      params: { amount }
    });
  }
}
