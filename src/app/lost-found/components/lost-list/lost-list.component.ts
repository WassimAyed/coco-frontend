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
          <p>The community platform to help recover your belongings.</p>
          <div class="header-actions">
            <button class="btn-primary" routerLink="post">
              <i class="bi bi-plus-circle"></i>
              Post a listing
            </button>
            <button class="btn-secondary-header" routerLink="my-actions">
              <i class="bi bi-collection"></i>
              Claims & reports
            </button>
          </div>
        </div>
      </header>

      <div class="content-wrapper">
        <aside class="filters-sidebar">
          <h3>Filters</h3>
          <div class="filter-group">
            <label>Keyword</label>
            <input class="form-input" type="text" [(ngModel)]="keyword" placeholder="title, description...">
          </div>
          <div class="filter-group">
            <label>Type</label>
            <select class="form-select" [(ngModel)]="selectedType">
              <option value="ALL">All</option>
              <option value="LOST">Lost</option>
              <option value="FOUND">Found</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select class="form-select" [(ngModel)]="selectedStatus">
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Category</label>
            <input class="form-input" type="text" [(ngModel)]="category" placeholder="electronics, keys...">
          </div>
          <div class="filter-group">
            <label>Location</label>
            <input class="form-input" type="text" [(ngModel)]="location" placeholder="campus, library...">
          </div>
          <div class="filter-actions">
            <button class="btn-primary filter-btn" (click)="runAdvancedSearch()">Search</button>
            <button class="btn-secondary filter-btn" (click)="resetFilters()">Reset</button>
          </div>
        </aside>

        <main class="items-panel">
          <div class="items-grid" *ngIf="filteredItems.length > 0; else noItems">
            <div class="item-card" *ngFor="let item of filteredItems" [routerLink]="['/lost-found/details', item.id]">
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
          </div>

          <div class="pagination-bar" *ngIf="totalPages > 1">
            <div class="pagination-summary">
              Page {{ currentPage + 1 }} of {{ totalPages }} • {{ totalElements }} items
            </div>
            <div class="pagination-controls">
              <button class="btn-secondary" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0">Previous</button>
              <button
                class="btn-page"
                *ngFor="let p of visiblePageNumbers"
                [class.active]="p === currentPage"
                (click)="goToPage(p)">
                {{ p + 1 }}
              </button>
              <button class="btn-secondary" (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1">Next</button>

              <label class="size-label" for="pageSize">Per page</label>
              <select id="pageSize" class="form-select page-size" [ngModel]="pageSize" (ngModelChange)="changePageSize($event)">
                <option [ngValue]="8">8</option>
                <option [ngValue]="12">12</option>
                <option [ngValue]="24">24</option>
              </select>
            </div>
          </div>

          <ng-template #noItems>
            <div class="empty-state">
              <div class="empty-icon"><i class="bi bi-search"></i></div>
              <h3>No items yet</h3>
              <p>Be the first to post a listing.</p>
            </div>
          </ng-template>
        </main>
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
    .filter-group { margin-bottom: 0.9rem; }
    .filter-group label { display: block; font-size: 0.85rem; color: #475569; font-weight: 600; margin-bottom: 0.35rem; }
    .form-select, .form-input { width: 100%; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0.55rem 0.65rem; }
    .filter-actions { display: flex; gap: 0.55rem; margin-top: 0.8rem; }
    .filter-btn { margin: 0 !important; width: 100%; justify-content: center; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; padding: 0.8rem 1.1rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; }
    
    .items-panel { min-height: 380px; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

    .pagination-bar { margin-top: 1rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.8rem; }
    .pagination-summary { color: #64748b; font-size: 0.9rem; }
    .pagination-controls { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
    .btn-page { border: 1px solid #cbd5e1; background: white; color: #1e293b; border-radius: 10px; min-width: 38px; height: 38px; font-weight: 700; cursor: pointer; }
    .btn-page.active { background: #1e293b; color: white; border-color: #1e293b; }
    .btn-page:hover { border-color: #94a3b8; }
    .btn-page.active:hover { border-color: #1e293b; }
    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .size-label { color: #475569; font-size: 0.85rem; font-weight: 600; margin-left: 0.35rem; }
    .page-size { width: auto; min-width: 76px; }
    
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
    
    .empty-state { height: 100%; min-height: 380px; text-align: center; padding: 3rem; background: white; border-radius: 32px; border: 2px dashed #e2e8f0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .empty-icon { width: 92px; height: 92px; border-radius: 50%; background: #eef2ff; color: #334155; display: grid; place-items: center; margin-bottom: 1rem; font-size: 2rem; }
    .empty-state h3 { margin: 0 0 0.4rem; color: #1e293b; }
    .empty-state p { margin: 0; color: #64748b; }
    
    .btn-primary { background: #1e293b; color: white; padding: 0.8rem 2rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; margin: 2rem auto 0; transition: all 0.3s; }
    .btn-primary:hover { background: #334155; transform: scale(1.05); }
    .header-actions { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; }
    .btn-secondary-header { background: #e2e8f0; color: #1e293b; padding: 0.8rem 1.2rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; margin-top: 2rem; }
  `]
})
export class LostListComponent implements OnInit {
  items: LostItem[] = [];
  filteredItems: LostItem[] = [];
  selectedType: string = 'ALL';
  selectedStatus: string = 'ALL';
  keyword = '';
  category = '';
  location = '';
  currentPage = 0;
  pageSize = 12;
  totalPages = 1;
  totalElements = 0;
  private usingAdvancedFilters = false;
  readonly fallbackImages: Record<'LOST' | 'FOUND', string> = {
    LOST: this.buildFallbackImage('LOST', '#ef4444'),
    FOUND: this.buildFallbackImage('FOUND', '#10b981')
  };

  constructor(private lostService: LostAndFoundService) { }

  ngOnInit(): void {
    this.loadItems(0);
  }

  get visiblePageNumbers(): number[] {
    const radius = 2;
    const start = Math.max(0, this.currentPage - radius);
    const end = Math.min(this.totalPages - 1, this.currentPage + radius);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  loadItems(page: number = this.currentPage): void {
    this.currentPage = Math.max(0, page);
    this.lostService.getAllItems(this.currentPage, this.pageSize).subscribe((data) => {
      const items: LostItem[] = Array.isArray(data) ? data : (data?.content || []);

      // Sort by newest first by default
      this.items = items.sort((a: LostItem, b: LostItem) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      this.filteredItems = this.items;

      if (Array.isArray(data)) {
        this.totalElements = data.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
      } else {
        this.totalElements = Number(data?.totalElements ?? this.filteredItems.length);
        this.totalPages = Math.max(1, Number(data?.totalPages ?? 1));
      }
    });
  }

  runAdvancedSearch(page: number = 0): void {
    this.usingAdvancedFilters = true;
    this.currentPage = Math.max(0, page);

    const payload = {
      keyword: this.keyword || undefined,
      type: this.selectedType !== 'ALL' ? this.selectedType as 'LOST' | 'FOUND' : undefined,
      status: this.selectedStatus !== 'ALL' ? this.selectedStatus as 'ACTIVE' | 'RESOLVED' : undefined,
      category: this.category || undefined,
      location: this.location || undefined,
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'createdAt',
      sortDir: 'desc' as const
    };

    this.lostService.advancedSearch(payload).subscribe({
      next: (data) => {
        const items: LostItem[] = Array.isArray(data) ? data : (data?.content || []);
        this.filteredItems = items;
        this.totalElements = Number(data?.totalElements ?? items.length);
        this.totalPages = Math.max(1, Number(data?.totalPages ?? 1));
      },
      error: () => {
        window.alert('Unable to apply advanced filters.');
      }
    });
  }

  resetFilters(): void {
    this.keyword = '';
    this.category = '';
    this.location = '';
    this.selectedType = 'ALL';
    this.selectedStatus = 'ALL';
    this.usingAdvancedFilters = false;
    this.loadItems(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    if (this.usingAdvancedFilters) {
      this.runAdvancedSearch(page);
      return;
    }

    this.loadItems(page);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    if (this.usingAdvancedFilters) {
      this.runAdvancedSearch(0);
      return;
    }
    this.loadItems(0);
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
