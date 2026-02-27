import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubsService } from '../../services/subs.service';
import { SubscriptionPlan } from '../../models/subscription.model';

@Component({
    selector: 'app-admin-plans',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="admin-page">
      <div class="mesh-gradient"></div>
      <div class="noise-overlay"></div>

      <div class="admin-container">
        <div class="header">
          <h1>Gestion des Plans</h1>
          <button class="btn btn-red" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i> Nouveau Plan
          </button>
        </div>

        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prix (TND)</th>
                <th>Limite Posts</th>
                <th>Durée (Jours)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plan of plans" class="fade-in">
                <td class="bold">{{ plan.name }}</td>
                <td>{{ plan.price }}</td>
                <td>{{ plan.postLimit || 'Illimité' }}</td>
                <td>{{ plan.durationDays }} j</td>
                <td class="actions">
                  <button class="icon-btn edit" (click)="editPlan(plan)"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn delete" (click)="deletePlan(plan.id!)"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal (Simple) -->
        <div class="modal-backdrop" *ngIf="showModal">
          <div class="modal-content">
            <h2>{{ isEditing ? 'Modifier le Plan' : 'Nouveau Plan' }}</h2>
            <div class="form-group">
              <label>Nom du Plan</label>
              <input [(ngModel)]="currentPlan.name" placeholder="ex: PREMIUM_PRO">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Prix (TND)</label>
                <input type="number" [(ngModel)]="currentPlan.price">
              </div>
              <div class="form-group">
                <label>Limite Posts</label>
                <input type="number" [(ngModel)]="currentPlan.postLimit">
              </div>
            </div>
            <div class="form-group">
              <label>Durée (Jours)</label>
              <input type="number" [(ngModel)]="currentPlan.durationDays">
            </div>
            <div class="modal-actions">
              <button class="btn btn-outline" (click)="closeModal()">Annuler</button>
              <button class="btn btn-red" (click)="savePlan()">Enregistrer</button>
            </div>
          </div>
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
      background: radial-gradient(circle at 0% 0%, rgba(230, 48, 48, 0.02) 0%, transparent 50%);
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

    .actions {
      display: flex; gap: 10px;
      .icon-btn {
        width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e8e8e8;
        background: white; cursor: pointer; transition: all 0.2s;
        &.edit:hover { background: #f8f9fa; color: #0a0a0a; border-color: #888; }
        &.delete:hover { background: #fff5f5; color: #e63030; border-color: #ffc1c1; }
      }
    }

    .btn {
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s;
      &-red { background: #e63030; color: white; border: none; box-shadow: 0 5px 15px rgba(230,48,48,0.3); }
      &-outline { background: transparent; border: 1px solid #e8e8e8; color: #0a0a0a; }
      &:hover { transform: translateY(-2px); opacity: 0.9; }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
      display: flex; justify-content: center; align-items: center; z-index: 100;
    }

    .modal-content {
      background: white; padding: 3rem; border-radius: 32px; width: 100%; max-width: 500px;
      h2 { font-family: 'Syne', sans-serif; margin-bottom: 2rem; }
    }

    .form-group {
      margin-bottom: 1.5rem;
      label { display: block; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.9rem; }
      input {
        width: 100%; padding: 1rem; border-radius: 12px; border: 1px solid #e8e8e8;
        font-family: 'DM Sans', sans-serif;
        &:focus { outline: none; border-color: #e63030; }
      }
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }

    .fade-in { animation: fadeIn 0.5s ease-out both; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminPlansComponent implements OnInit {
    plans: SubscriptionPlan[] = [];
    showModal = false;
    isEditing = false;
    currentPlan: SubscriptionPlan = this.initPlan();

    constructor(private subsService: SubsService) { }

    ngOnInit() { this.loadPlans(); }

    loadPlans() {
        this.subsService.getAllPlans().subscribe(data => this.plans = data);
    }

    initPlan(): SubscriptionPlan {
        return { name: '', price: 0, postLimit: 0, durationDays: 30, type: 'SUBSCRIPTION' };
    }

    openCreateModal() {
        this.isEditing = false;
        this.currentPlan = this.initPlan();
        this.showModal = true;
    }

    editPlan(plan: SubscriptionPlan) {
        this.isEditing = true;
        this.currentPlan = { ...plan };
        this.showModal = true;
    }

    closeModal() { this.showModal = false; }

    savePlan() {
        if (this.isEditing) {
            this.subsService.updatePlan(this.currentPlan.id!, this.currentPlan).subscribe(() => {
                this.loadPlans();
                this.closeModal();
            });
        } else {
            this.subsService.createPlan(this.currentPlan).subscribe(() => {
                this.loadPlans();
                this.closeModal();
            });
        }
    }

    deletePlan(id: number) {
        if (confirm('Supprimer ce plan ?')) {
            this.subsService.deletePlan(id).subscribe(() => this.loadPlans());
        }
    }
}
