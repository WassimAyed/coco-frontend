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
          <h1 class="gradient-text">My Listings</h1>
          <p>A list of all items you have posted.</p>
          <button class="btn-primary mt-4" routerLink="/lost-found/post">
            <i class="bi bi-plus-circle"></i> Create listing
          </button>
        </div>
      </header>

      <div class="content-wrapper">
        <main class="items-grid" *ngIf="myItems.length > 0; else noItems">
          <div class="item-card" *ngFor="let item of myItems" [routerLink]="['/lost-found/details', item.id]">
            <div class="card-image">
              <img [src]="item.imageUrl || getFallbackByType(item.type)" (error)="onImageError($event, item.type)" alt="Item">
              <span class="type-badge" [class.lost]="item.type === 'LOST'">
                {{ item.type === 'LOST' ? 'Lost' : 'Found' }}
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
            <h3>No listings found</h3>
            <p>You have not posted any lost or found items yet.</p>
            <button class="btn-primary mt-4" routerLink="/lost-found/post">Post now</button>
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
    
    .card-image { height: 200px; position: relative; overflow: hidden; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .item-card:hover .card-image img { transform: scale(1.1); }
    .card-image img.fallback-mode { object-fit: contain; padding: 1rem; transform: none !important; }
    
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
  readonly fallbackImages: Record<'LOST' | 'FOUND', string> = {
    LOST: this.buildFallbackImage('LOST', '#ef4444'),
    FOUND: this.buildFallbackImage('FOUND', '#10b981')
  };

    constructor(private lostService: LostAndFoundService) { }

    ngOnInit(): void {
        const storedId = localStorage.getItem('userId');
        if (storedId) {
            this.userId = Number(storedId);
            this.lostService.getAllItems().subscribe(data => {
          const items: LostItem[] = Array.isArray(data) ? data : (data?.content || []);

          this.myItems = items
              .filter((item: LostItem) => item.userId === this.userId)
              .sort((a: LostItem, b: LostItem) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            });
        }
    }

      getFallbackByType(type: 'LOST' | 'FOUND'): string {
        return this.fallbackImages[type] ?? this.fallbackImages.LOST;
      }

      onImageError(event: Event, type: 'LOST' | 'FOUND'): void {
        const img = event.target as HTMLImageElement;
        if (!img) return;

        img.src = this.getFallbackByType(type);
        img.classList.add('fallback-mode');
      }

      private buildFallbackImage(label: 'LOST' | 'FOUND', accent: string): string {
          const badgeText = label === 'LOST' ? 'LOST' : 'FOUND';
          const icon = label === 'LOST' ? '!' : '✓';

          const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f8fafc"/>
              <stop offset="100%" stop-color="#e2e8f0"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="675" fill="url(#bg)"/>
          <rect x="455" y="170" width="290" height="320" rx="46" fill="#1e293b"/>
          <rect x="470" y="190" width="260" height="230" rx="30" fill="#334155"/>
          <rect x="515" y="450" width="170" height="18" rx="9" fill="#64748b" opacity="0.55"/>
          <circle cx="600" cy="92" r="34" fill="${accent}" opacity="0.2"/>
          <text x="600" y="104" text-anchor="middle" font-size="40" font-family="Arial" font-weight="700" fill="${accent}">${icon}</text>
          <rect x="70" y="70" width="170" height="54" rx="16" fill="${accent}"/>
          <text x="155" y="105" text-anchor="middle" font-size="24" font-family="Arial" font-weight="700" fill="#ffffff">${badgeText}</text>
          <text x="600" y="600" text-anchor="middle" font-size="46" font-family="Arial" font-weight="700" fill="#1e293b">COCO</text>
        </svg>
      `;

          return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      }
}
