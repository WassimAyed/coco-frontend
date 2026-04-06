import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
    selector: 'app-user-lost-items',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="user-items-container">
      <header class="page-header">
        <div class="header-content">
          <h1 class="gradient-text">Mes Annonces</h1>
          <p>La liste de tous les objets que vous avez déclarés.</p>
          <button class="btn-primary mt-4" routerLink="/lost-found/post">
            <i class="bi bi-plus-circle"></i> Créer une annonce
          </button>
        </div>
      </header>

      <div class="content-wrapper">
        <main class="items-grid" *ngIf="myItems.length > 0; else noItems">
          <div class="item-card" *ngFor="let item of myItems" [routerLink]="['/lost-found/details', item.id]">
            <div class="card-image">
              <img [src]="item.imageUrl || 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=600&auto=format&fit=crop'" alt="Item">
              <span class="type-badge" [class.lost]="item.type === 'LOST'">
                {{ item.type === 'LOST' ? 'Perdu' : 'Trouvé' }}
              </span>
            </div>
            <div class="card-body">
              <div class="item-category">{{ item.category }}</div>
              <h3 class="item-title">{{ item.title }}</h3>
              <div class="item-info">
                <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                <span><i class="bi bi-clock"></i> {{ item.dateTime }}</span>
              </div>
            </div>
          </div>
        </main>

        <ng-template #noItems>
          <div class="empty-state">
            <i class="bi bi-folder-x" style="font-size: 4rem; color: #cbd5e1;"></i>
            <h3>Aucune annonce trouvée</h3>
            <p>Vous n'avez pas encore publié d'objets perdus ou trouvés.</p>
            <button class="btn-primary mt-4" routerLink="/lost-found/post">Publier maintenant</button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
    styles: [`
    .user-items-container { min-height: 100vh; background: #f8fafc; font-family: 'Outfit', sans-serif; }
    
    .page-header { background: white; padding: 4rem 2rem; border-bottom: 1px solid #e2e8f0; text-align: center; }
    .gradient-text { font-size: 3rem; font-weight: 800; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; }
    .page-header p { color: #64748b; font-size: 1.1rem; }
    
    .content-wrapper { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
    
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .item-card { background: white; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
    .item-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #3b82f6; }
    
    .card-image { height: 200px; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .item-card:hover .card-image img { transform: scale(1.1); }
    
    .type-badge { position: absolute; top: 1rem; left: 1rem; padding: 0.5rem 1rem; border-radius: 12px; background: #10b981; color: white; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .type-badge.lost { background: #ef4444; }
    
    .card-body { padding: 1.5rem; }
    .item-category { font-size: 0.75rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 0.5rem; }
    .item-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; }
    .item-info { display: flex; flex-direction: column; gap: 0.5rem; color: #64748b; font-size: 0.9rem; }
    
    .empty-state { text-align: center; padding: 4rem; background: white; border-radius: 32px; border: 2px dashed #e2e8f0; }
    .empty-state h3 { font-size: 1.5rem; margin-top: 1rem; color: #1e293b; }
    
    .btn-primary { background: #1e293b; color: white; padding: 0.8rem 2rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.3s; }
    .btn-primary:hover { background: #334155; transform: scale(1.05); }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class UserLostItemsComponent implements OnInit {
    myItems: LostItem[] = [];
    userId!: number;

    constructor(private lostService: LostAndFoundService) { }

    ngOnInit(): void {
        const storedId = localStorage.getItem('userId');
        if (storedId) {
            this.userId = Number(storedId);
            this.lostService.getAllItems().subscribe(data => {
                this.myItems = data.filter(item => item.userId === this.userId)
                    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            });
        }
    }
}
