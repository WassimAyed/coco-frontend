import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubsService } from '../../services/subs.service';
import { UserSubscription, Payment } from '../../models/subscription.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-page">
      <div class="mesh-gradient"></div>
      <div class="noise-overlay"></div>

      <div class="dashboard-container">
        <div class="header" *ngIf="activeSubscription">
          <h1>Mon Abonnement</h1>
          <p>Gérez vos avantages et suivez votre consommation.</p>
        </div>

        <div class="dashboard-content" *ngIf="activeSubscription; else noSub">
          <!-- Banner Alerte -->
          <div class="alert-banner" *ngIf="showWarning()" class="fade-in">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>{{ getWarningMessage() }}</span>
            <button class="upgrade-link" routerLink="/subs-payment">Renouveler / Améliorer</button>
          </div>

          <!-- Widget Plan Actuel -->
          <div class="card plan-card">
            <div class="card-header">
              <span class="plan-tag">PLAN ACTUEL</span>
              <h2>{{ activeSubscription.plan.name }}</h2>
            </div>
            
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">Jours Restants</span>
                <span class="value">{{ getRemainingDays() }}</span>
              </div>
              <div class="stat-item">
                <span class="label">Quota Posts</span>
                <span class="value">{{ activeSubscription.remainingPosts ?? '∞' }}</span>
              </div>
            </div>

            <div class="progress-container">
              <div class="progress-bar">
                <div class="fill" [style.width.%]="getProgress()"></div>
              </div>
              <div class="dates">
                <span>Début: {{ activeSubscription.startDate | date:'dd/MM/yyyy' }}</span>
                <span>Fin: {{ activeSubscription.endDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <button class="btn btn-outline" routerLink="/subs-payment">Changer de plan</button>
          </div>

          <!-- Section Avantages -->
          <div class="card benefits-card">
            <h3>Mes Avantages</h3>
            <ul class="benefits-list">
              <li><i class="bi bi-check-circle"></i> Support prioritaire 24/7</li>
              <li><i class="bi bi-check-circle"></i> Visibilité Boostée</li>
              <li><i class="bi bi-check-circle"></i> Badge certifié sur vos offres</li>
            </ul>
          </div>
        </div>

        <!-- Section Historique -->
        <div class="history-section" *ngIf="payments.length > 0">
          <h3>Historique des Paiements</h3>
          <div class="table-card">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Facture</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of payments" class="fade-in">
                  <td>{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="bold">{{ p.subscription.plan.name }}</td>
                  <td>{{ p.amount }} {{ p.currency }}</td>
                  <td>
                    <span class="status-pill" [ngClass]="p.status">{{ p.status }}</span>
                  </td>
                  <td>
                    <button class="pdf-btn" (click)="downloadInvoice(p.id!)">
                      <i class="bi bi-file-earmark-pdf"></i> PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <ng-template #noSub>
          <div class="empty-state">
            <i class="bi bi-credit-card-2-back"></i>
            <h2>Aucun abonnement actif</h2>
            <p>Souscrivez à un plan pour débloquer toutes les fonctionnalités.</p>
            <button class="btn btn-red" routerLink="/subs-payment">Voir les Plans</button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .user-page {
      min-height: 100vh;
      background-color: #f5f5f3;
      font-family: 'DM Sans', sans-serif;
      color: #0a0a0a;
      padding: 6rem 2rem;
      position: relative;
    }

    .mesh-gradient {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 0;
      background: radial-gradient(circle at 100% 0%, rgba(230, 48, 48, 0.03) 0%, transparent 40%);
    }

    .dashboard-container { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; }

    .header {
      margin-bottom: 3rem;
      h1 { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
      p { color: #888; font-size: 1.1rem; }
    }

    .dashboard-content { display: grid; gap: 2rem; grid-template-columns: 1.5fr 1fr; }

    .card {
      background: white; border-radius: 24px; padding: 2.5rem; border: 1px solid #e8e8e8;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      animation: fadeUp 0.8s ease-out both;
    }

    .plan-tag { font-size: 0.7rem; font-weight: 700; color: #e63030; letter-spacing: 1px; }
    h2 { font-family: 'Syne', sans-serif; margin-top: 0.5rem; font-size: 2rem; }

    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0; }
    .stat-item {
      .label { display: block; color: #888; font-size: 0.85rem; margin-bottom: 0.5rem; }
      .value { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; }
    }

    .progress-container {
      margin-bottom: 2.5rem;
      .progress-bar { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; }
      .fill { height: 100%; background: #e63030; border-radius: 4px; transition: width 1s ease-out; }
      .dates { display: flex; justify-content: space-between; font-size: 0.8rem; color: #888; }
    }

    .benefits-card {
      h3 { font-family: 'Syne', sans-serif; margin-bottom: 1.5rem; }
      .benefits-list {
        list-style: none; padding: 0;
        li { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 1rem; color: #555; }
        i { color: #16a34a; font-size: 1.1rem; }
      }
    }

    .alert-banner {
      grid-column: span 2; background: #fff5f5; border: 1px solid #feb2b2; padding: 1rem 1.5rem; border-radius: 16px;
      display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; color: #c53030; font-weight: 600; font-size: 0.9rem;
      i { font-size: 1.2rem; }
      .upgrade-link { margin-left: auto; background: #e63030; color: white; border: none; padding: 6px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    }

    .history-section {
      margin-top: 4rem;
      h3 { font-family: 'Syne', sans-serif; font-size: 1.8rem; margin-bottom: 2rem; }
    }

    .history-table {
      width: 100%; border-collapse: collapse;
      th { text-align: left; padding: 1.25rem; color: #888; font-size: 0.85rem; text-transform: uppercase; }
      td { padding: 1.25rem; border-top: 1px solid #f0f0f0; font-size: 0.95rem; }
      .bold { font-weight: 700; color: #0a0a0a; }
    }

    .status-pill {
      padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700;
      &.SUCCESS, &.ACTIVE { background: #e6fcf5; color: #0ca678; }
      &.FAILED, &.EXPIRED { background: #fff5f5; color: #fa5252; }
    }

    .pdf-btn {
      background: #f8f9fa; border: 1px solid #e8e8e8; padding: 6px 12px; border-radius: 8px;
      cursor: pointer; transition: all 0.2s; font-weight: 600; font-size: 0.8rem;
      &:hover { background: #0a0a0a; color: white; border-color: #0a0a0a; }
    }

    .table-card { background: white; border-radius: 24px; padding: 1rem; border: 1px solid #e8e8e8; }

    .empty-state {
      text-align: center; padding: 5rem; background: white; border-radius: 32px; border: 1px dashed #e8e8e8;
      i { font-size: 4rem; color: #e8e8e8; margin-bottom: 2rem; display: block; }
      h2 { font-family: 'Syne', sans-serif; margin-bottom: 1rem; }
      p { color: #888; margin-bottom: 2rem; }
    }

    .btn {
      width: 100%; padding: 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s;
      &:hover { transform: translateY(-2px); opacity: 0.9; }
    }
    .btn-red { background: #e63030; color: white; border: none; }
    .btn-outline { background: transparent; border: 1px solid #e8e8e8; color: #0a0a0a; }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 768px) { .dashboard-content { grid-template-columns: 1fr; } }
  `]
})
export class UserDashboardComponent implements OnInit {
  activeSubscription?: UserSubscription;
  payments: Payment[] = [];
  userId = 1; // Statique pour la démo

  constructor(private subsService: SubsService) { }

  ngOnInit() {
    this.subsService.getUserSubscriptions(this.userId).subscribe(subs => {
      this.activeSubscription = subs.find(s => s.status === 'ACTIVE');
    });
    this.loadHistory();
  }

  loadHistory() {
    this.subsService.getUserPayments(this.userId).subscribe(data => {
      this.payments = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  }

  downloadInvoice(paymentId: number) {
    this.subsService.downloadInvoice(paymentId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_coco_${paymentId}.pdf`;
      a.click();
    });
  }

  getRemainingDays(): number {
    if (!this.activeSubscription?.endDate) return 0;
    const end = new Date(this.activeSubscription.endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getProgress(): number {
    if (!this.activeSubscription?.endDate || !this.activeSubscription?.startDate) return 0;
    const start = new Date(this.activeSubscription.startDate).getTime();
    const end = new Date(this.activeSubscription.endDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  showWarning(): boolean {
    if (!this.activeSubscription) return false;
    const lowQuota = (this.activeSubscription?.remainingPosts !== null && (this.activeSubscription?.remainingPosts ?? 100) <= 5);
    const nearExpiration = this.getRemainingDays() <= 3;
    return lowQuota || nearExpiration;
  }

  getWarningMessage(): string {
    const sub = this.activeSubscription;
    if (sub?.remainingPosts !== null && (sub?.remainingPosts ?? 0) <= 5) {
      return "Attention : Votre quota de posts est presque épuisé ! (" + sub?.remainingPosts + " restants)";
    }
    return "Attention : Votre abonnement expire dans " + this.getRemainingDays() + " jours.";
  }
}
