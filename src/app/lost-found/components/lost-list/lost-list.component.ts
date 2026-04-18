import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LostAndFoundService } from '../../services/lost-found.service';
import { UserService } from '../../../user-security/services/user.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
  selector: 'app-lost-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="lost-container">
      <header class="page-header">
        <div class="header-content">
          <div>
            <span class="header-eyebrow">Platform</span>
            <h1 class="header-title">Lost & Found Hub</h1>
            <p class="header-subtitle">Recover the items that matter most to you.</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" routerLink="post">
              <i class="bi bi-plus-circle"></i>
              Post a listing
            </button>
            <button class="btn-outline" routerLink="my-items">
              <i class="bi bi-wallet2"></i>
              My Claims
            </button>
          </div>
        </div>
        <div class="header-decoration">
          <div class="deco-circle deco-circle--1"></div>
          <div class="deco-circle deco-circle--2"></div>
        </div>
      </header>

      <div class="content-wrapper">
        <aside class="filters-sidebar">
          <h3 class="sidebar-title">Filters</h3>
          <div class="filter-group">
            <label>Keyword</label>
            <div class="input-wrap">
              <i class="bi bi-search"></i>
              <input type="text" [(ngModel)]="keyword" placeholder="Search...">
            </div>
          </div>
          <div class="filter-group">
            <label>Type</label>
            <select class="form-select" [(ngModel)]="selectedType">
              <option value="ALL">All Types</option>
              <option value="LOST">Lost</option>
              <option value="FOUND">Found</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select class="form-select" [(ngModel)]="selectedStatus">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Category</label>
            <input class="form-input" type="text" [(ngModel)]="category" placeholder="Electronics, keys...">
          </div>
          <div class="filter-actions">
            <button class="btn-primary filter-btn" (click)="runAdvancedSearch()">Search</button>
            <button class="btn-ghost" (click)="resetFilters()">Reset</button>
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
                <span class="status-overlay" *ngIf="item.status === 'RESOLVED'">Resolved</span>
              </div>
              <div class="card-body">
                <span class="item-cat-badge">{{ item.category }}</span>
                <h3 class="item-title">{{ item.title }}</h3>
                <div class="item-metadata">
                  <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                  <span><i class="bi bi-calendar3"></i> {{ item.dateTime | date:'shortDate' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-bar" *ngIf="totalPages > 1">
            <div class="pagination-info">
              Showing {{ currentPage + 1 }} of {{ totalPages }}
            </div>
            <div class="pagination-nav">
              <button class="nav-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button
                class="page-num"
                *ngFor="let p of visiblePageNumbers"
                [class.active]="p === currentPage"
                (click)="goToPage(p)">
                {{ p + 1 }}
              </button>
              <button class="nav-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          <ng-template #noItems>
            <div class="empty-state-hub">
              <div class="empty-circle"><i class="bi bi-search"></i></div>
              <h3>No items found</h3>
              <p>Try adjusting your filters or post a new listing.</p>
            </div>
          </ng-template>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .lost-container { min-height: 100vh; background: #fdfdfd; font-family: 'Outfit', sans-serif; }
    
    /* Header Standardized */
    .page-header {
      position: relative;
      background: linear-gradient(135deg, #1a1a1a 0%, #262626 55%, #3d1417 100%);
      padding: 3.5rem 2.5rem 4.5rem;
      overflow: hidden;
      color: #fff;
      text-align: left;
    }
    .header-content { position: relative; z-index: 2; max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-eyebrow { display: inline-flex; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #f83441; background: rgba(248, 52, 65, 0.1); padding: 0.3rem 0.8rem; border-radius: 30px; border: 1px solid rgba(248, 52, 65, 0.3); margin-bottom: 0.8rem; }
    .header-title { font-size: 2.8rem; font-weight: 800; margin: 0; }
    .header-subtitle { color: rgba(255,255,255,0.6); margin: 0.4rem 0 0; font-size: 1.1rem; }
    
    .header-actions { display: flex; gap: 1rem; }
    .btn-primary { background: #f83441; color: white; border: none; padding: 0.8rem 1.6rem; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: transform 0.2s, background 0.2s; }
    .btn-primary:hover { background: #e02d38; transform: translateY(-2px); }
    .btn-outline { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.8rem 1.6rem; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s; }
    .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

    .header-decoration { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
    .deco-circle { position: absolute; border-radius: 50%; background: #f83441; opacity: 0.08; }
    .deco-circle--1 { width: 400px; height: 400px; right: -100px; top: -150px; }
    .deco-circle--2 { width: 250px; height: 250px; left: 10%; bottom: -50px; opacity: 0.05; background: white; }

    /* Layout */
    .content-wrapper { max-width: 1400px; margin: -1.75rem auto 3rem; padding: 0 2rem; position: relative; z-index: 5; display: grid; grid-template-columns: 310px 1fr; gap: 2.5rem; }
    
    .filters-sidebar { background: white; padding: 1.75rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; height: fit-content; position: sticky; top: 2rem; }
    .sidebar-title { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; }
    .filter-group { margin-bottom: 1.25rem; }
    .filter-group label { display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
    .input-wrap { position: relative; }
    .input-wrap i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .input-wrap input { padding-left: 2.2rem; }
    .form-input, .form-select { width: 100%; padding: 0.7rem 0.85rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; color: #1e293b; font-weight: 500; }
    .form-input:focus, .form-select:focus { outline: none; border-color: #f83441; background: white; }
    
    .filter-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
    .filter-btn { width: 100%; justify-content: center; margin: 0; }
    .btn-ghost { background: transparent; color: #64748b; border: none; font-weight: 700; cursor: pointer; padding: 0.5rem; font-size: 0.9rem; }
    .btn-ghost:hover { color: #f83441; }

    /* Grid & Cards */
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
    .item-card { background: white; border-radius: 28px; overflow: hidden; border: 1px solid #f1f5f9; transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01); }
    .item-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.12), 0 18px 36px -18px rgba(0,0,0,0.1); border-color: #f83441; }
    
    .card-image { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; background: #f8fafc; }
    .card-image::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%); opacity: 0.6; pointer-events: none; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.2, 0, 0, 1); }
    .item-card:hover .card-image img { transform: scale(1.12); }
    .card-image img.fallback-mode { object-fit: contain; padding: 2rem; }
    .type-badge { position: absolute; top: 1.25rem; left: 1.25rem; padding: 0.4rem 0.9rem; border-radius: 30px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: white; background: #10b981; backdrop-filter: blur(4px); }
    .type-badge.lost { background: #f83441; }
    .status-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; text-transform: uppercase; font-size: 1.2rem; pointer-events: none; }
    
    .card-body { padding: 1.5rem; }
    .item-cat-badge { display: inline-block; font-size: 0.65rem; font-weight: 800; color: #f83441; background: rgba(248,52,65,0.08); padding: 0.2rem 0.6rem; border-radius: 4px; text-transform: uppercase; margin-bottom: 0.75rem; }
    .item-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0 0 1rem; line-height: 1.3; }
    .item-metadata { display: flex; flex-direction: column; gap: 0.5rem; color: #64748b; font-size: 0.88rem; font-weight: 500; }
    .item-metadata span { display: flex; align-items: center; gap: 0.5rem; }
    .item-metadata i { color: #f83441; opacity: 0.8; }

    /* Pagination */
    .pagination-bar { margin-top: 3rem; display: flex; align-items: center; justify-content: space-between; }
    .pagination-info { font-size: 0.9rem; font-weight: 600; color: #64748b; }
    .pagination-nav { display: flex; gap: 0.5rem; }
    .nav-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #1e293b; }
    .page-num { min-width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 700; color: #64748b; }
    .page-num.active { background: #1e293b; color: white; border-color: #1e293b; }
    .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .empty-state-hub { padding: 5rem 2rem; text-align: center; background: white; border-radius: 32px; border: 2px dashed #e2e8f0; }
    .empty-circle { width: 80px; height: 80px; background: #fff1f2; color: #f83441; border-radius: 50%; display: grid; place-items: center; font-size: 1.75rem; margin: 0 auto 1.5rem; }
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

  constructor(private lostService: LostAndFoundService, private userService: UserService) { }

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
    this.usingAdvancedFilters = false;

    this.lostService.getAllItems(this.currentPage, this.pageSize).subscribe(
      (data) => {
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
      },
      (error) => {
        console.error('Error loading items:', error);
        // Retry without userId header by forcing an immediate reload
        if (!this.userService.currentUser()) {
          localStorage.setItem('userId', '1');
          setTimeout(() => this.loadItems(page), 500);
        }
      }
    );
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
