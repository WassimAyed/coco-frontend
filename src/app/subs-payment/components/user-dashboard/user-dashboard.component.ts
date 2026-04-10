import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SubsService } from '../../services/subs.service';
import { UserSubscription, Payment } from '../../models/subscription.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="offres-page">
      <div class="page-header">
        <div class="header-content">
          <div>
            <span class="header-eyebrow">Subscription center</span>
            <h1 class="header-title">My Dashboard</h1>
            <p class="header-subtitle">Manage your plan, usage, and payments</p>
          </div>

          <div class="header-stats" *ngIf="activeSubscription">
            <div class="stat-pill">
              <span class="stat-num">{{ getRemainingDays() }}</span>
              <span class="stat-label">Days left</span>
            </div>
            <div class="stat-pill stat-pill--active">
              <span class="stat-num">{{ activeSubscription.remainingPosts ?? '∞' }}</span>
              <span class="stat-label">Posts left</span>
            </div>
          </div>
        </div>
        <div class="header-decoration">
          <div class="deco-circle deco-circle--1"></div>
          <div class="deco-circle deco-circle--2"></div>
        </div>
      </div>

      <div class="content-area">
        <div class="alert-banner" *ngIf="activeSubscription && showWarning()">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ getWarningMessage() }}</span>
          <button class="upgrade-link" routerLink="/subs-payment">Renew / Upgrade</button>
        </div>

        <div class="dashboard-content" *ngIf="activeSubscription; else noSub">
          <div class="card plan-card">
            <span class="plan-tag">CURRENT PLAN</span>
            <h2>{{ activeSubscription.plan.name }}</h2>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">Days Remaining</span>
                <span class="value">{{ getRemainingDays() }}</span>
              </div>
              <div class="stat-item">
                <span class="label">Post Quota</span>
                <span class="value">{{ activeSubscription.remainingPosts ?? '∞' }}</span>
              </div>
            </div>

            <div class="progress-container">
              <div class="progress-bar">
                <div class="fill" [style.width.%]="getProgress()"></div>
              </div>
              <div class="dates">
                <span>Start: {{ activeSubscription.startDate | date:'dd/MM/yyyy' }}</span>
                <span>End: {{ activeSubscription.endDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <button class="btn btn-outline" routerLink="/subs-payment">Change plan</button>
          </div>

          <div class="card benefits-card">
            <h3>My Benefits</h3>
            <ul class="benefits-list">
              <li><i class="bi bi-check-circle"></i> Priority support 24/7</li>
              <li><i class="bi bi-check-circle"></i> Boosted visibility</li>
              <li><i class="bi bi-check-circle"></i> Verified badge on your offers</li>
            </ul>
          </div>
        </div>

        <div class="history-section" *ngIf="payments.length > 0">
          <h3>Payment History</h3>
          <div class="table-card">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of payments">
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
            <h2>No active subscription</h2>
            <p>Subscribe to a plan to unlock all features.</p>
            <button class="btn btn-red" routerLink="/subs-payment">View Plans</button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .offres-page {
      min-height: 100vh;
      background: #f4f4f6;
      padding-bottom: 3rem;
      font-family: 'DM Sans', sans-serif;
    }

    .page-header {
      position: relative;
      background: linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 55%, #3a1215 100%);
      padding: 2.75rem 2.5rem 3.5rem;
      overflow: hidden;
      color: #fff;
    }

    .header-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.25rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-eyebrow {
      display: inline-flex;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #f83441;
      background: rgba(248, 52, 65, 0.12);
      border: 1px solid rgba(248, 52, 65, 0.3);
      border-radius: 30px;
      padding: 0.3rem 0.85rem;
      margin-bottom: 0.6rem;
    }

    .header-title {
      font-size: 2.2rem;
      font-weight: 800;
      margin: 0 0 0.25rem;
      font-family: 'Syne', sans-serif;
    }

    .header-subtitle {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
    }

    .header-stats { display: flex; gap: 0.75rem; }

    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 0.75rem 1.4rem;
      min-width: 84px;
    }

    .stat-pill--active {
      background: rgba(248, 52, 65, 0.15);
      border-color: rgba(248, 52, 65, 0.35);
    }

    .stat-num { font-size: 1.8rem; font-weight: 800; line-height: 1; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.6); }

    .header-decoration { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
    .deco-circle { position: absolute; border-radius: 50%; opacity: 0.07; background: #f83441; }
    .deco-circle--1 { width: 360px; height: 360px; right: -70px; top: -130px; }
    .deco-circle--2 { width: 200px; height: 200px; right: 220px; bottom: -90px; background: #fff; opacity: 0.04; }

    .content-area {
      max-width: 1200px;
      margin: -1.5rem auto 0;
      padding: 0 1.5rem;
      position: relative;
      z-index: 3;
    }

    .dashboard-content { display: grid; gap: 1.5rem; grid-template-columns: 1.5fr 1fr; }

    .card {
      background: #fff;
      border-radius: 18px;
      padding: 2rem;
      border: 1px solid #ececec;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }

    .plan-tag { font-size: 0.7rem; font-weight: 700; color: #e63030; letter-spacing: 1px; }
    h2 { font-family: 'Syne', sans-serif; margin-top: 0.5rem; font-size: 2rem; margin-bottom: 0.2rem; }

    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
    .stat-item .label { display: block; color: #777; font-size: 0.85rem; margin-bottom: 0.4rem; }
    .stat-item .value { font-family: 'Syne', sans-serif; font-size: 1.9rem; font-weight: 800; }

    .progress-container {
      margin-bottom: 1.75rem;
    }

    .progress-bar {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .fill {
      height: 100%;
      background: #e63030;
      border-radius: 4px;
      transition: width 1s ease-out;
    }

    .dates {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #888;
    }

    .benefits-card h3 { font-family: 'Syne', sans-serif; margin-bottom: 1.1rem; }
    .benefits-list { list-style: none; padding: 0; margin: 0; }
    .benefits-list li { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 0.85rem; color: #555; }
    .benefits-list i { color: #16a34a; font-size: 1.1rem; }

    .alert-banner {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      padding: 1rem 1.2rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1rem;
      color: #c53030;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .alert-banner i { font-size: 1.2rem; }

    .upgrade-link {
      margin-left: auto;
      background: #e63030;
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .history-section {
      margin-top: 2rem;
    }

    .history-section h3 { font-family: 'Syne', sans-serif; font-size: 1.5rem; margin-bottom: 1rem; }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .history-table th {
      text-align: left;
      padding: 1rem;
      color: #888;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .history-table td {
      padding: 1rem;
      border-top: 1px solid #f0f0f0;
      font-size: 0.92rem;
    }

    .history-table .bold { font-weight: 700; color: #0a0a0a; }

    .status-pill {
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .status-pill.SUCCESS,
    .status-pill.ACTIVE { background: #e6fcf5; color: #0ca678; }

    .status-pill.FAILED,
    .status-pill.EXPIRED { background: #fff5f5; color: #fa5252; }

    .pdf-btn {
      background: #f8f9fa;
      border: 1px solid #e8e8e8;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .pdf-btn:hover { background: #0a0a0a; color: white; border-color: #0a0a0a; }

    .table-card {
      background: #fff;
      border-radius: 18px;
      padding: 0.5rem;
      border: 1px solid #ececec;
      box-shadow: 0 4px 24px rgba(0,0,0,0.05);
      overflow-x: auto;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #fff;
      border-radius: 20px;
      border: 1px dashed #e8e8e8;
      box-shadow: 0 4px 24px rgba(0,0,0,0.05);
    }

    .empty-state i { font-size: 4rem; color: #e8e8e8; margin-bottom: 1.5rem; display: block; }
    .empty-state h2 { font-family: 'Syne', sans-serif; margin-bottom: 0.75rem; }
    .empty-state p { color: #888; margin-bottom: 1.5rem; }

    .btn {
      width: 100%;
      padding: 0.9rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn:hover { transform: translateY(-2px); opacity: 0.92; }

    .btn-red { background: #e63030; color: white; border: none; }
    .btn-outline { background: transparent; border: 1px solid #e8e8e8; color: #0a0a0a; }

    @media (max-width: 900px) {
      .dashboard-content {
        grid-template-columns: 1fr;
      }

      .alert-banner {
        flex-wrap: wrap;
      }

      .upgrade-link {
        margin-left: 0;
      }
    }

    @media (max-width: 640px) {
      .header-title {
        font-size: 1.8rem;
      }

      .content-area {
        padding: 0 1rem;
      }

      .card {
        padding: 1.25rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .dates {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `]
})
export class UserDashboardComponent implements OnInit {
  activeSubscription?: UserSubscription;
  payments: Payment[] = [];
  userId!: number;

  constructor(private subsService: SubsService, private router: Router) { }

  ngOnInit() {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      console.warn('User not logged in, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }
    this.userId = Number(storedId);
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
    const now = new Date().setHours(0, 0, 0, 0);
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
    return Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
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
      return 'Warning: your post quota is almost exhausted! (' + sub?.remainingPosts + ' left)';
    }
    return 'Warning: your subscription expires in ' + this.getRemainingDays() + ' days.';
  }
}
