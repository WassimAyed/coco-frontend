import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubsService } from '../../services/subs.service';
import { SubscriptionPlan } from '../../models/subscription.model';
import { LucideAngularModule, Edit, XCircle, LucideIconData } from 'lucide-angular';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <section class="plans-shell">
      <div class="plans-header">
        <div>
          <span class="header-eyebrow">SubPayment Admin</span>
          <h2>Subscription Plans</h2>
          <p>Create and manage all plans from one place.</p>
        </div>

        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-value">{{ plans.length }}</span>
            <span class="stat-label">Total Plans</span>
          </div>
          <div class="stat-pill stat-pill--active">
            <span class="stat-value">{{ paidPlansCount }}</span>
            <span class="stat-label">Paid Plans</span>
          </div>
        </div>
      </div>

      <div class="plans-grid">
        <article class="card form-card">
          <div class="card-head">
            <h3>{{ isEditing ? 'Edit Plan' : 'Create Plan' }}</h3>
            <button *ngIf="isEditing" class="btn btn-outline" (click)="resetForm()">Cancel edit</button>
          </div>

          <div class="form-grid">
            <div class="field full">
              <label>Plan Name</label>
              <input [(ngModel)]="currentPlan.name" placeholder="e.g. PREMIUM_PRO" />
            </div>

            <div class="field">
              <label>Price (TND)</label>
              <input type="number" [(ngModel)]="currentPlan.price" min="0" />
            </div>

            <div class="field">
              <label>Post Limit</label>
              <input type="number" [(ngModel)]="currentPlan.postLimit" min="0" />
            </div>

            <div class="field full">
              <label>Duration (days)</label>
              <input type="number" [(ngModel)]="currentPlan.durationDays" min="1" />
            </div>
          </div>

          <button class="btn btn-primary" (click)="savePlan()" [disabled]="!currentPlan.name.trim()">
            {{ isEditing ? 'Update Plan' : 'Create Plan' }}
          </button>
        </article>

        <article class="card tips-card">
          <h3>Quick tips</h3>
          <ul>
            <li>Use clear plan names (e.g. FREE, MONTHLY, YEARLY).</li>
            <li>Set <strong>Post Limit = 0</strong> for unlimited posting.</li>
            <li>Review duration and pricing before publishing.</li>
          </ul>
        </article>
      </div>

      <article class="card table-card">
        <div class="card-head">
          <h3>Existing Plans</h3>
        </div>

        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price (TND)</th>
                <th>Post Limit</th>
                <th>Duration (Days)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plan of plans">
                <td class="bold">{{ plan.name }}</td>
                <td>{{ plan.price }}</td>
                <td>{{ plan.postLimit || 'Unlimited' }}</td>
                <td>{{ plan.durationDays }} d</td>
                <td class="actions">
                  <button class="icon-btn edit" type="button" (click)="editPlan(plan)" aria-label="Edit plan">
                    <lucide-icon [img]="EditIcon" [size]="16"></lucide-icon>
                  </button>
                  <button class="icon-btn delete" type="button" (click)="deletePlan(plan.id!)" aria-label="Delete plan">
                    <lucide-icon [img]="DeleteIcon" [size]="16"></lucide-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .plans-shell {
      display: grid;
      gap: 1.25rem;
    }

    .plans-header {
      background: linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 55%, #3a1215 100%);
      border-radius: 18px;
      color: #fff;
      padding: 1.4rem 1.5rem;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      position: relative;
      overflow: hidden;
    }

    .header-eyebrow {
      display: inline-flex;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #f83441;
      background: rgba(248, 52, 65, 0.15);
      border: 1px solid rgba(248, 52, 65, 0.3);
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      margin-bottom: 0.45rem;
    }

    .plans-header h2 {
      margin: 0;
      font-size: 1.55rem;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
    }

    .plans-header p {
      margin: 0.3rem 0 0;
      color: rgba(255, 255, 255, 0.65);
      font-size: 0.9rem;
    }

    .header-stats {
      display: flex;
      gap: 0.55rem;
    }

    .stat-pill {
      min-width: 95px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 0.6rem 0.8rem;
      text-align: center;
    }

    .stat-pill--active {
      background: rgba(248, 52, 65, 0.2);
      border-color: rgba(248, 52, 65, 0.35);
    }

    .stat-value { display: block; font-size: 1.35rem; font-weight: 800; line-height: 1; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.72); }

    .plans-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 1.25rem;
    }

    .card {
      background: #fff;
      border: 1px solid #e9e9e9;
      border-radius: 18px;
      padding: 1.2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.7rem;
      margin-bottom: 0.9rem;
    }

    .card-head h3 {
      margin: 0;
      font-size: 1.1rem;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.8rem;
      margin-bottom: 1rem;
    }

    .field.full {
      grid-column: 1 / -1;
    }

    .field label {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: #444;
    }

    .field input {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 0.68rem 0.75rem;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .field input:focus {
      border-color: #f83441;
      box-shadow: 0 0 0 3px rgba(248, 52, 65, 0.12);
    }

    .tips-card ul {
      margin: 0.2rem 0 0;
      padding-left: 1rem;
      color: #555;
      font-size: 0.9rem;
      line-height: 1.65;
    }

    .table-wrap {
      overflow-x: auto;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
    }

    .admin-table th {
      text-align: left;
      padding: 0.95rem;
      color: #888;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .admin-table td {
      padding: 0.95rem;
      border-top: 1px solid #efefef;
      font-size: 0.9rem;
    }

    .bold {
      font-weight: 700;
      color: #151515;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      width: 34px;
      height: 34px;
      border: 1px solid #e2e2e2;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .icon-btn.edit:hover {
      border-color: #c9c9c9;
      background: #f7f7f7;
    }

    .icon-btn.delete:hover {
      border-color: #f5c4c8;
      background: #fff5f6;
      color: #d32030;
    }

    .btn {
      border: none;
      border-radius: 10px;
      padding: 0.65rem 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #f83441;
      color: #fff;
    }

    .btn-primary:not(:disabled):hover {
      background: #e62a37;
      transform: translateY(-1px);
    }

    .btn-outline {
      background: #fff;
      border: 1px solid #ddd;
      color: #444;
    }

    .btn-outline:hover {
      border-color: #c8c8c8;
    }

    @media (max-width: 920px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .header-stats {
        width: 100%;
      }

      .stat-pill {
        flex: 1;
      }
    }
  `]
})
export class AdminPlansComponent implements OnInit {
  readonly EditIcon: LucideIconData = Edit;
  readonly DeleteIcon: LucideIconData = XCircle;
  plans: SubscriptionPlan[] = [];
  isEditing = false;
  currentPlan: SubscriptionPlan = this.initPlan();
  private pendingDeletePlanId: number | null = null;
  private pendingDeleteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private subsService: SubsService,
    private toast: ToastService
  ) { }

  ngOnInit() { this.loadPlans(); }

  loadPlans() {
    this.subsService.getAllPlans().subscribe(data => this.plans = data);
  }

  initPlan(): SubscriptionPlan {
    return { name: '', price: 0, postLimit: 0, durationDays: 30, type: 'SUBSCRIPTION' };
  }

  editPlan(plan: SubscriptionPlan) {
    this.isEditing = true;
    this.currentPlan = { ...plan };
  }

  resetForm() {
    this.isEditing = false;
    this.currentPlan = this.initPlan();
  }

  savePlan() {
    if (!this.currentPlan.name?.trim()) {
      return;
    }

    if (this.isEditing) {
      this.subsService.updatePlan(this.currentPlan.id!, this.currentPlan).subscribe(() => {
        this.loadPlans();
        this.resetForm();
      });
    } else {
      this.subsService.createPlan(this.currentPlan).subscribe(() => {
        this.loadPlans();
        this.resetForm();
      });
    }
  }

  deletePlan(id: number) {
    if (this.pendingDeletePlanId !== id) {
      this.pendingDeletePlanId = id;
      if (this.pendingDeleteTimer) {
        clearTimeout(this.pendingDeleteTimer);
      }
      this.pendingDeleteTimer = setTimeout(() => {
        this.pendingDeletePlanId = null;
        this.pendingDeleteTimer = null;
      }, 5000);
      this.toast.warning('Click delete again within 5 seconds to confirm.', 'Confirm delete');
      return;
    }

    this.pendingDeletePlanId = null;
    if (this.pendingDeleteTimer) {
      clearTimeout(this.pendingDeleteTimer);
      this.pendingDeleteTimer = null;
    }

    this.subsService.deletePlan(id).subscribe({
      next: () => {
        this.toast.success('Plan deleted successfully.');
        this.loadPlans();
      },
      error: (err) => {
        const message = err?.error?.message || 'Unable to delete plan.';
        this.toast.error(message, 'Delete failed');
      }
    });
  }

  get paidPlansCount(): number {
    return this.plans.filter((plan) => (plan.price ?? 0) > 0).length;
  }
}
