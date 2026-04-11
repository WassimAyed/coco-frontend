import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-user-lost-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="offres-page">
      <div class="page-header">
        <div class="header-content">
          <div>
            <span class="header-eyebrow">Dashboard</span>
            <h1 class="header-title">My Items</h1>
            <p class="header-subtitle">Manage all your Lost & Found posts</p>
          </div>

          <div class="header-stats">
            <div class="stat-pill">
              <span class="stat-num">{{ lostItemsCount }}</span>
              <span class="stat-label">Lost Posts</span>
            </div>
            <div class="stat-pill stat-pill--active">
              <span class="stat-num">{{ foundItemsCount }}</span>
              <span class="stat-label">Found Posts</span>
            </div>
          </div>
        </div>

        <div class="header-decoration">
          <div class="deco-circle deco-circle--1"></div>
          <div class="deco-circle deco-circle--2"></div>
        </div>
      </div>

      <div class="content-area">
        <div class="toolbar">
          <div class="search-bar">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Search by title, category, or location..."
            />
          </div>

          <div class="toolbar-actions">
            <button class="btn-secondary" (click)="backToList()">Back to list</button>
            <button class="btn-primary" (click)="createNewItem()">Create post</button>
          </div>
        </div>

        <div *ngIf="myItems.length === 0" class="empty-state">
          <div class="empty-icon-wrap">
            <div class="empty-icon-ring"></div>
            <i class="bi bi-folder-x"></i>
          </div>
          <h3 class="empty-title">No posts yet</h3>
          <p class="empty-desc">You have not posted any lost or found item yet.</p>
          <button class="btn-primary mt-4" (click)="createNewItem()">Create my first post</button>
        </div>

        <div *ngIf="myItems.length > 0 && filteredItems.length === 0" class="empty-state">
          <div class="empty-icon-wrap">
            <div class="empty-icon-ring"></div>
            <i class="bi bi-search"></i>
          </div>
          <h3 class="empty-title">No results</h3>
          <p class="empty-desc">No posts match "{{ searchTerm }}".</p>
          <button class="btn-secondary mt-4" (click)="searchTerm = ''">Reset</button>
        </div>

        <main class="offers-grid" *ngIf="filteredItems.length > 0">
          <article class="offer-card" *ngFor="let item of filteredItems" [routerLink]="['/lost-found/details', item.id]">
            <div class="card-img-wrap">
              <img
                [src]="item.imageUrl || getFallbackByType(item.type)"
                (error)="onImageError($event, item.type)"
                alt="Item image"
                class="card-img"
              >

              <span class="floating-badge" [class.badge-lost]="item.type === 'LOST'" [class.badge-found]="item.type === 'FOUND'">
                {{ item.type === 'LOST' ? 'Lost' : 'Found' }}
              </span>

              <span class="floating-badge floating-badge--status" [class.badge-active]="item.status === 'ACTIVE'" [class.badge-blocked]="item.status === 'BLOCKED'" [class.badge-resolved]="item.status !== 'ACTIVE' && item.status !== 'BLOCKED'">
                {{ item.status === 'ACTIVE' ? 'Active' : (item.status === 'BLOCKED' ? 'Blocked' : 'Resolved') }}
              </span>
            </div>

            <div class="card-body">
              <div class="card-top">
                <h3 class="card-title">{{ item.title }}</h3>
                <span class="card-category">{{ item.category }}</span>
              </div>

              <div class="card-meta">
                <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
                <span><i class="bi bi-clock"></i> {{ item.dateTime | date:'short' }}</span>
              </div>

              <div class="card-actions">
                <button class="action-btn action-btn--view" (click)="onViewItem($event, item)">View</button>
                <button class="action-btn action-btn--edit" (click)="onEditItem($event, item)">Edit</button>
                <button class="action-btn action-btn--delete" (click)="onDeleteItem($event, item)">Delete</button>
              </div>
            </div>
          </article>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .offres-page {
      min-height: 100vh;
      background: #f4f4f6;
      padding-bottom: 3rem;
      font-family: 'Outfit', sans-serif;
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

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-bar {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 560px;
    }

    .search-bar input {
      width: 100%;
      padding: 0.9rem 1rem 0.9rem 2.8rem;
      border-radius: 30px;
      border: 1px solid #e0e0e0;
      background: #fff;
      outline: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }

    .search-bar input:focus {
      border-color: #f83441;
      box-shadow: 0 4px 20px rgba(248,52,65,0.1);
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9a9a9a;
    }

    .toolbar-actions { display: flex; gap: 0.65rem; flex-wrap: wrap; }

    .btn-primary,
    .btn-secondary {
      border: none;
      border-radius: 12px;
      padding: 0.7rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary { background: #f83441; color: #fff; }
    .btn-primary:hover { background: #e92b38; transform: translateY(-1px); }
    .btn-secondary { background: #fff; border: 1px solid #e6e6e6; color: #444; }
    .btn-secondary:hover { border-color: #d0d0d0; }

    .offers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 1.5rem;
    }

    .offer-card {
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      display: flex;
      flex-direction: column;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      text-decoration: none;
      color: inherit;
    }

    .offer-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 36px rgba(0,0,0,0.13);
    }

    .card-img-wrap {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: linear-gradient(135deg, #f0f0f0, #e4e4e4);
    }

    .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .offer-card:hover .card-img { transform: scale(1.04); }
    .card-img.fallback-mode { object-fit: contain; padding: 1rem; transform: none !important; }

    .floating-badge {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      padding: 0.3rem 0.75rem;
      border-radius: 30px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      border: 1px solid transparent;
      backdrop-filter: blur(6px);
    }

    .floating-badge--status {
      left: auto;
      right: 0.75rem;
    }

    .badge-lost { background: rgba(248, 52, 65, 0.16); color: #d31e2b; border-color: rgba(248, 52, 65, 0.33); }
    .badge-found { background: rgba(16, 185, 129, 0.16); color: #0f8c61; border-color: rgba(16, 185, 129, 0.33); }
    .badge-active { background: rgba(59, 130, 246, 0.18); color: #2563eb; border-color: rgba(59, 130, 246, 0.35); }
    .badge-blocked { background: rgba(239, 68, 68, 0.2); color: #b91c1c; border-color: rgba(239, 68, 68, 0.35); }
    .badge-resolved { background: rgba(120,120,120,0.2); color: #666; border-color: rgba(120,120,120,0.25); }

    .card-body { padding: 1.2rem 1.3rem 1.3rem; display: flex; flex-direction: column; gap: 0.8rem; }
    .card-top { display: flex; justify-content: space-between; gap: 0.5rem; align-items: flex-start; }
    .card-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #1c1c1c;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 70%;
    }
    .card-category {
      font-size: 0.72rem;
      font-weight: 700;
      color: #f83441;
      background: rgba(248,52,65,0.1);
      border-radius: 999px;
      padding: 0.25rem 0.55rem;
      text-transform: uppercase;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      color: #616161;
      font-size: 0.88rem;
    }

    .card-actions { display: flex; gap: 0.55rem; margin-top: 0.3rem; }
    .action-btn {
      flex: 1;
      border: none;
      border-radius: 10px;
      padding: 0.58rem 0.7rem;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .action-btn--view { background: #f3f4f6; color: #2f2f2f; }
    .action-btn--view:hover { background: #e5e7eb; }
    .action-btn--edit { background: rgba(59,130,246,0.14); color: #2563eb; }
    .action-btn--edit:hover { background: rgba(59,130,246,0.24); }
    .action-btn--delete { background: rgba(248,52,65,0.12); color: #d31e2b; }
    .action-btn--delete:hover { background: rgba(248,52,65,0.22); }

    .empty-state {
      background: #fff;
      border-radius: 20px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }

    .empty-icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 90px;
      height: 90px;
      margin: 0 auto 1.5rem;
    }

    .empty-icon-wrap i { font-size: 2.2rem; color: rgba(44,44,44,0.24); }

    .empty-icon-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px dashed rgba(248, 52, 65, 0.25);
      animation: spin 18s linear infinite;
    }

    .empty-title { margin: 0 0 0.5rem; }
    .empty-desc { color: #8a8a8a; margin: 0; }
    .mt-4 { margin-top: 1rem; }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class UserLostItemsComponent implements OnInit {
  myItems: LostItem[] = [];
  searchTerm = '';
  userId!: number;

  readonly fallbackImages: Record<'LOST' | 'FOUND', string> = {
    LOST: this.buildFallbackImage('LOST', '#ef4444'),
    FOUND: this.buildFallbackImage('FOUND', '#10b981')
  };

  constructor(
    private lostService: LostAndFoundService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const resolvedUserId = this.resolveCurrentUserId();
    if (!resolvedUserId) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = Number(resolvedUserId);
    this.lostService.getMyItems().subscribe((items) => {
      this.myItems = items.sort(
        (a: LostItem, b: LostItem) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
    });
  }

  private resolveCurrentUserId(): string | null {
    const fromSession = this.userService.currentUser()?.id;
    if (fromSession) {
      const value = String(fromSession);
      if (localStorage.getItem('userId') !== value) {
        localStorage.setItem('userId', value);
      }
      return value;
    }

    return localStorage.getItem('userId');
  }

  get filteredItems(): LostItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.myItems;
    }

    return this.myItems.filter((item) =>
      item.title.toLowerCase().includes(term)
      || item.category.toLowerCase().includes(term)
      || item.location.toLowerCase().includes(term)
    );
  }

  get lostItemsCount(): number {
    return this.myItems.filter((item) => item.type === 'LOST').length;
  }

  get foundItemsCount(): number {
    return this.myItems.filter((item) => item.type === 'FOUND').length;
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

  onViewItem(event: Event, item: LostItem): void {
    event.stopPropagation();
    event.preventDefault();

    if (!item.id) return;
    this.router.navigate(['/lost-found/details', item.id]);
  }

  onEditItem(event: Event, item: LostItem): void {
    event.stopPropagation();
    event.preventDefault();

    if (!item.id) return;
    this.router.navigate(['/lost-found/post'], { queryParams: { editId: item.id } });
  }

  onDeleteItem(event: Event, item: LostItem): void {
    event.stopPropagation();
    event.preventDefault();

    if (!item.id) return;

    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;

    this.lostService.deleteItem(item.id).subscribe({
      next: () => {
        this.myItems = this.myItems.filter((i) => i.id !== item.id);
      },
      error: () => {
        window.alert('Unable to delete this item. Please try again.');
      }
    });
  }

  createNewItem(): void {
    this.router.navigate(['/lost-found/post']);
  }

  backToList(): void {
    this.router.navigate(['/lost-found']);
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
