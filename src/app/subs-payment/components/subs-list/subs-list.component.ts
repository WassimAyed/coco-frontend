import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubsService } from '../../services/subs.service';
import { SubscriptionPlan } from '../../models/subscription.model';

@Component({
  selector: 'app-subs-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subs-list.component.html',
  styleUrl: './subs-list.component.scss'
})
export class SubsListComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading = true;
  userId!: number;

  constructor(private subsService: SubsService, private router: Router) { }

  ngOnInit(): void {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      console.warn('User not logged in, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }
    this.userId = Number(storedId);
    this.loadPlans();
  }

  loadPlans(): void {
    this.subsService.getAllPlans().subscribe({
      next: (data) => {
        // Hide FREE plan from available plans list
        this.plans = data.filter(p => !p.name.includes('FREE'));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading plans', err);
        this.loading = false;
      }
    });
  }

  getTopPlans(): SubscriptionPlan[] {
    return this.plans.filter(p => p.name !== 'PAY_PER_POST');
  }

  getBottomPlan(): SubscriptionPlan | undefined {
    return this.plans.find(p => p.name === 'PAY_PER_POST');
  }

  getFeatures(planName: string): string[] {
    const common = ['24/7 technical support', 'Increased visibility'];
    if (planName.includes('FREE')) return ['5 posts included', ...common];
    if (planName === 'PAY_PER_POST') return ['1 post included', ...common];
    return ['Unlimited posts', ...common];
  }

  getDescription(planName: string): string {
    if (planName.includes('FREE')) return 'Ideal for trying the platform.';
    if (planName === 'MONTHLY') return 'The perfect choice for professionals.';
    if (planName === 'YEARLY') return 'Save more with the yearly plan.';
    return 'Only pay for what you post.';
  }

  getButtonText(planName: string): string {
    if (planName.includes('FREE')) return 'GET STARTED';
    if (planName === 'PAY_PER_POST') return 'BUY ONE POST';
    return 'SUBSCRIBE';
  }

  getDelay(planName: string): string {
    if (planName.includes('FREE')) return '0s';
    if (planName === 'MONTHLY') return '0.1s';
    if (planName === 'YEARLY') return '0.2s';
    return '0.3s';
  }

  onSubscribe(planId: number): void {
    if (!planId) return;

    this.subsService.initiatePayment(this.userId, planId).subscribe({
      next: (url) => {
        // Real redirect to Stripe Checkout
        window.location.href = url;
      },
      error: (err) => alert('Payment error: ' + err.message)
    });
  }
}
