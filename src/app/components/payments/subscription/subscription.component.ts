import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, SubscriptionPlan, UserSubscription } from '../../services/payment.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  userSubscription: UserSubscription | null = null;
  loading = false;
  error: string | null = null;
  processingPayment = false;

  constructor(
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadUserSubscription();
  }

  loadPlans(): void {
    this.loading = true;
    this.paymentService.getPlans().subscribe({
      next: (plans: any) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load subscription plans';
        console.error(error);
        this.loading = false;
      }
    });
  }

  loadUserSubscription(): void {
    this.paymentService.getUserSubscriptions().subscribe({
      next: (subscriptions: any) => {
        this.userSubscription = subscriptions.length > 0 ? subscriptions[0] : null;
      },
      error: (error: any) => {
        console.error('Failed to load user subscription', error);
      }
    });
  }

  startPayment(plan: SubscriptionPlan): void {
    if (plan.price === 0) {
      alert('Free plan activated!');
      this.loadUserSubscription();
      return;
    }

    this.processingPayment = true;
    this.paymentService.createPaymentSession(plan.id).subscribe({
      next: (url: any) => {
        // Redirect to Stripe
        window.location.href = url;
      },
      error: (error: any) => {
        this.error = 'Failed to create payment session';
        console.error(error);
        this.processingPayment = false;
      }
    });
  }

  viewPaymentHistory(): void {
    this.router.navigate(['/payments/history']);
  }

  getPlanColor(type: string): string {
    switch (type) {
      case 'FREE':
        return 'bg-gray-50';
      case 'MONTHLY':
        return 'bg-blue-50';
      case 'YEARLY':
        return 'bg-purple-50';
      default:
        return 'bg-white';
    }
  }

  getPlanBorderColor(type: string): string {
    switch (type) {
      case 'FREE':
        return 'border-gray-200';
      case 'MONTHLY':
        return 'border-blue-200';
      case 'YEARLY':
        return 'border-purple-200';
      default:
        return 'border-gray-200';
    }
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return this.userSubscription?.plan?.id === plan.id && this.userSubscription?.status === 'ACTIVE';
  }
}
