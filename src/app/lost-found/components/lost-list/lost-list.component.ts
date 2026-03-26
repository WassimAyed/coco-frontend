import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
  selector: 'app-lost-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="lost-container">
      <header class="page-header">
        <div class="header-content">
          <h1 class="gradient-text">Lost & Found Hub</h1>
          <p>La plateforme communautaire pour retrouver vos objets préférés.</p>
          <div class="header-actions">
            <button class="btn-primary" routerLink="post">
              <i class="bi bi-plus-circle"></i>
              Publier une annonce
            </button>
          </div>
        </div>
      </header>

      <div class="content-wrapper">
        <aside class="filters-sidebar">
          <h3>Filtres</h3>
          <div class="filter-group">
            <label>Type</label>
            <select class="form-select" [(ngModel)]="selectedType" (change)="applyFilter()">
              <option value="ALL">Tous</option>
              <option value="LOST">Perdu</option>
              <option value="FOUND">Trouvé</option>
            </select>
          </div>
        </aside>

        <main class="items-grid" *ngIf="filteredItems.length > 0; else noItems">
          <div class="item-card" *ngFor="let item of filteredItems" [routerLink]="['/lost-found/details', item.id]">
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
            <img src="https://illustrations.popsy.co/amber/searching.svg" alt="Empty">
            <h3>Aucun objet pour le moment</h3>
            <p>Soyez le premier à poster une annonce !</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .lost-container { min-height: 100vh; background: #f8fafc; font-family: 'Outfit', sans-serif; }
    
    .page-header { background: white; padding: 4rem 2rem; border-bottom: 1px solid #e2e8f0; text-align: center; }
    .gradient-text { font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; }
    .page-header p { color: #64748b; font-size: 1.1rem; }
    
    .content-wrapper { max-width: 1400px; margin: -2rem auto 2rem; padding: 0 2rem; display: grid; grid-template-columns: 280px 1fr; gap: 2rem; }
    
    .filters-sidebar { background: white; padding: 1.5rem; border-radius: 20px; border: 1px solid #e2e8f0; height: fit-content; position: sticky; top: 2rem; }
    
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .item-card { background: white; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
    .item-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #3b82f6; }
    
    .card-image { height: 200px; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: crop; transition: transform 0.5s; }
    .item-card:hover .card-image img { transform: scale(1.1); }
    
    .type-badge { position: absolute; top: 1rem; left: 1rem; padding: 0.5rem 1rem; border-radius: 12px; background: #10b981; color: white; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .type-badge.lost { background: #ef4444; }
    
    .card-body { padding: 1.5rem; }
    .item-category { font-size: 0.75rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 0.5rem; }
    .item-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; }
    .item-info { display: flex; flex-direction: column; gap: 0.5rem; color: #64748b; font-size: 0.9rem; }
    
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; background: white; border-radius: 32px; border: 2px dashed #e2e8f0; }
    .empty-state img { width: 200px; margin-bottom: 2rem; }
    
    .btn-primary { background: #1e293b; color: white; padding: 0.8rem 2rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; margin: 2rem auto 0; transition: all 0.3s; }
    .btn-primary:hover { background: #334155; transform: scale(1.05); }
  `]
})
export class LostListComponent implements OnInit {
  items: LostItem[] = [];
  filteredItems: LostItem[] = [];
  selectedType: string = 'ALL';

  constructor(private lostService: LostAndFoundService) { }

  ngOnInit(): void {
    this.lostService.getAllItems().subscribe((data) => {
      // Trier du plus récent au plus ancien par défaut
      this.items = data.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      this.filteredItems = this.items;
    });
  }

  applyFilter(): void {
    if (this.selectedType === 'ALL') {
      this.filteredItems = this.items;
    } else {
      this.filteredItems = this.items.filter(item => item.type === this.selectedType);
    }
  }
}
