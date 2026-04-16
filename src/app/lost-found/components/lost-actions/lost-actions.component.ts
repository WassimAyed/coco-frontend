import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { ItemClaimResponse, ItemReportResponse } from '../../models/lost-item.model';

@Component({
  selector: 'app-lost-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="actions-page">
      <div class="page-head">
        <h1>Claims & Reports</h1>
        <p>Track your claim workflow and reporting history.</p>
      </div>

      <div class="grid-two">
        <div *ngIf="errorMessage" class="global-error">{{ errorMessage }}</div>
        <section class="panel">
          <h2>My Claims</h2>
          <div *ngIf="claims.length === 0" class="empty">No claims yet.</div>
          <div class="row" *ngFor="let claim of claims">
            <div>
              <strong>{{ getItemDisplayName(claim.itemId) }}</strong>
              <p>{{ claim.proofMessage }}</p>
            </div>
            <span class="badge" [class.pending]="claim.status === 'PENDING'">{{ claim.status }}</span>
          </div>
        </section>

        <section class="panel">
          <h2>My Reports</h2>
          <div *ngIf="reports.length === 0" class="empty">No reports yet.</div>
          <div class="row" *ngFor="let report of reports">
            <div>
              <strong>{{ getItemDisplayName(report.itemId) }}</strong>
              <p>{{ report.reason }}</p>
            </div>
            <span class="badge" [class.pending]="report.status === 'OPEN'">{{ report.status }}</span>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .actions-page { min-height: 100vh; background: #f8fafc; padding: 2rem; }
    .page-head { max-width: 1100px; margin: 0 auto 1rem; }
    .page-head h1 { font-weight: 800; color: #0f172a; }
    .page-head p { color: #64748b; }
    .grid-two { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .global-error { grid-column: 1 / -1; background: #fee2e2; color: #7f1d1d; border: 1px solid #fecaca; padding: 0.8rem 1rem; border-radius: 10px; }
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; }
    .panel h2 { font-size: 1.1rem; margin-bottom: 0.8rem; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-top: 1px solid #f1f5f9; padding: 0.8rem 0; }
    .row p { margin: 0; color: #64748b; font-size: 0.9rem; }
    .badge { font-size: 0.75rem; font-weight: 700; border-radius: 999px; padding: 0.3rem 0.65rem; background: #e2e8f0; }
    .badge.pending { background: #fef3c7; color: #92400e; }
    .empty { color: #64748b; font-size: 0.9rem; }
    @media (max-width: 900px) { .grid-two { grid-template-columns: 1fr; } }
  `]
})
export class LostActionsComponent implements OnInit {
  claims: ItemClaimResponse[] = [];
  reports: ItemReportResponse[] = [];
  errorMessage = '';
  itemTitles: Record<number, string> = {};

  constructor(private lostService: LostAndFoundService) {}

  ngOnInit(): void {
    this.lostService.getMyClaims().subscribe({
      next: (data) => {
        this.claims = data || [];
        this.resolveItemTitles();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to load your claims.';
      }
    });

    this.lostService.getMyReports().subscribe({
      next: (data) => {
        this.reports = data || [];
        this.resolveItemTitles();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to load your reports.';
      }
    });
  }

  private resolveItemTitles(): void {
    const ids = Array.from(new Set([
      ...(this.claims || []).map(c => c.itemId),
      ...(this.reports || []).map(r => r.itemId)
    ].filter(Boolean)));

    ids.forEach((id) => {
      if (this.itemTitles[id]) {
        return;
      }

      this.lostService.getItemById(id).subscribe({
        next: (item) => {
          this.itemTitles[id] = item?.title || `Item ${id}`;
        },
        error: () => {
          this.itemTitles[id] = `Item ${id}`;
        }
      });
    });
  }

  getItemDisplayName(itemId: number): string {
    return this.itemTitles[itemId] || `Item ${itemId}`;
  }
}
