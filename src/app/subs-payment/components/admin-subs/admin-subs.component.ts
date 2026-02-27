import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubsService } from '../../services/subs.service';
import { UserSubscription } from '../../models/subscription.model';

@Component({
    selector: 'app-admin-subs',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-page">
      <div class="mesh-gradient"></div>
      <div class="noise-overlay"></div>

      <div class="admin-container">
        <div class="header">
          <h1>Suivi des Abonnements</h1>
          <div class="stats">
            <div class="stat-badge">Total: {{ subscriptions.length }}</div>
          </div>
        </div>

        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Utilisateur (ID)</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Quota</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sub of subscriptions" class="fade-in">
                <td class="bold">User #{{ sub.userId }}</td>
                <td>
                  <span class="plan-pill" [ngClass]="sub.plan.name">
                    {{ sub.plan.name }}
                  </span>
                </td>
                <td>
                  <span class="status-pill" [ngClass]="sub.status">
                    {{ sub.status }}
                  </span>
                </td>
                <td>{{ sub.startDate | date:'dd/MM/yyyy' }}</td>
                <td>{{ sub.endDate | date:'dd/MM/yyyy' }}</td>
                <td>{{ sub.remainingPosts ?? '∞' }} posts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .admin-page {
      min-height: 100vh;
      background-color: #f5f5f3;
      font-family: 'DM Sans', sans-serif;
      color: #0a0a0a;
      padding: 4rem 2rem;
      position: relative;
    }

    .mesh-gradient {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 0;
      background: radial-gradient(circle at 100% 100%, rgba(230, 48, 48, 0.02) 0%, transparent 50%);
    }

    .admin-container {
      position: relative; z-index: 2;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 3rem;
      h1 { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; }
    }

    .stat-badge {
      background: white; border: 1px solid #e8e8e8; padding: 0.5rem 1rem; border-radius: 100px;
      font-weight: 700; font-size: 0.85rem; color: #888;
    }

    .table-card {
      background: white; border-radius: 24px; padding: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border: 1px solid #e8e8e8;
    }

    .admin-table {
      width: 100%; border-collapse: collapse;
      th { text-align: left; padding: 1.25rem; color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
      td { padding: 1.25rem; border-top: 1px solid #f0f0f0; }
      .bold { font-weight: 700; color: #0a0a0a; }
    }

    .plan-pill {
      padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 800;
      &.MONTHLY { background: #fff5f5; color: #e63030; }
      &.YEARLY { background: #f0fdf4; color: #16a34a; }
      &.FREE_PROMO { background: #f8f9fa; color: #888; }
    }

    .status-pill {
      padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700;
      &.ACTIVE { background: #e6fcf5; color: #0ca678; }
      &.EXPIRED { background: #fff5f5; color: #fa5252; }
    }

    .fade-in { animation: fadeIn 0.5s ease-out both; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminSubsComponent implements OnInit {
    subscriptions: UserSubscription[] = [];

    constructor(private subsService: SubsService) { }

    ngOnInit() {
        this.subsService.getAllUserSubscriptions().subscribe(data => this.subscriptions = data);
    }
}
