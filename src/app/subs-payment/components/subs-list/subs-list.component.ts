import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  userId = 1; // ID statique pour la démo

  constructor(private subsService: SubsService) { }

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.subsService.getAllPlans().subscribe({
      next: (data) => {
        this.plans = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement plans', err);
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
    const common = ["Support technique 24/7", "Visibilité accrue"];
    if (planName === 'FREE_PROMO') return ["5 Posts inclus", ...common];
    if (planName === 'PAY_PER_POST') return ["1 Post inclus", ...common];
    return ["Posts Illimités", ...common];
  }

  getDescription(planName: string): string {
    if (planName === 'FREE_PROMO') return "Idéal pour tester la plateforme.";
    if (planName === 'MONTHLY') return "Le choix parfait pour les professionnels.";
    if (planName === 'YEARLY') return "Économisez gros avec le plan annuel.";
    return "Payez uniquement ce que vous postez.";
  }

  getButtonText(planName: string): string {
    if (planName === 'FREE_PROMO') return "COMMENCER";
    if (planName === 'PAY_PER_POST') return "ACHETER UN POST";
    return "S'ABONNER";
  }

  getDelay(planName: string): string {
    if (planName === 'FREE_PROMO') return '0s';
    if (planName === 'MONTHLY') return '0.1s';
    if (planName === 'YEARLY') return '0.2s';
    return '0.3s';
  }

  onSubscribe(planId: number): void {
    if (!planId) return;

    this.subsService.initiatePayment(this.userId, planId).subscribe({
      next: (url) => {
        // Redirection réelle vers le Checkout Stripe
        window.location.href = url;
      },
      error: (err) => alert('Erreur lors du paiement: ' + err.message)
    });
  }
}
