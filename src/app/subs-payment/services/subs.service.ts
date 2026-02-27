import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubscriptionPlan, UserSubscription, Payment } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubsService {
  private apiUrl = 'http://localhost:9092/api/payment';

  constructor(private http: HttpClient) { }

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
    return this.http.get<any>(`${this.apiUrl}/quota/${userId}`);
  }

  getUserSubscriptions(userId: number): Observable<UserSubscription[]> {
    // Note: On pourrait filtrer par userId si le backend le supportait spécifiquement, 
    // ici on pourra filtrer côté client ou utiliser getAllUserSubscriptions si l'admin/user partage le service.
    return this.http.get<UserSubscription[]>(`${this.apiUrl}/user-subscriptions`);
  }

  createUserSubscription(userId: number): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(`${this.apiUrl}/user-subscriptions`, userId);
  }

  // Paiement
  initiatePayment(userId: number, planId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/payments`, null, {
      params: { userId, planId },
      responseType: 'text'
    });
  }

  getUserPayments(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/user/${userId}`);
  }

  downloadInvoice(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/invoice`, {
      responseType: 'blob'
    });
  }

  addBonusPosts(userId: number, amount: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/bonus/${userId}`, null, {
      params: { amount }
    });
  }
}
