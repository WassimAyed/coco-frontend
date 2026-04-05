import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
    selector: 'app-lost-details',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="details-container" *ngIf="item">
      <div class="details-wrapper">
        <button class="btn-back" routerLink="/lost-found">
          <i class="bi bi-arrow-left"></i> Back to listings
        </button>
        
        <div class="card-details">
          <div class="image-section">
            <img [src]="item.imageUrl || getFallbackByType(item.type)" (error)="onImageError($event, item.type)" alt="Item">
            <div class="hero-badge" [class.lost]="item.type === 'LOST'">
              {{ item.type === 'LOST' ? 'Lost item' : 'Found item' }}
            </div>
          </div>
          
          <div class="info-section">
            <span class="category-tag">{{ item.category }}</span>
            <h1>{{ item.title }}</h1>
            
            <div class="meta-data">
              <div class="meta-item">
                <i class="bi bi-geo-alt-fill text-blue"></i>
                <div>
                  <strong>Location</strong>
                  <p>{{ item.location }}</p>
                </div>
              </div>
              <div class="meta-item">
                <i class="bi bi-calendar-event-fill text-blue"></i>
                <div>
                  <strong>Date</strong>
                  <p>{{ item.dateTime }}</p>
                </div>
              </div>
            </div>

            <div class="description-box">
              <h3>Detailed description</h3>
              <p>{{ item.description || 'No additional description provided.' }}</p>
            </div>

            <div class="contact-card">
              <h3>Contact owner</h3>
              <div class="contact-info">
                <i class="bi bi-person-lines-fill"></i>
                <span>{{ item.contactInfo }}</span>
              </div>
              <button class="btn-contact">
                Contact now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="loading-state" *ngIf="!item">
      <div class="spinner"></div>
      <p>Loading details...</p>
    </div>
  `,
    styles: [`
    .details-container { min-height: 100vh; background: #f8fafc; font-family: 'Outfit', sans-serif; padding: 3rem 1rem; }
    .details-wrapper { max-width: 1100px; margin: 0 auto; }
    
    .btn-back { background: white; border: 1px solid #e2e8f0; padding: 0.6rem 1.2rem; border-radius: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #475569; margin-bottom: 2rem; transition: all 0.2s; }
    .btn-back:hover { background: #f1f5f9; transform: translateX(-4px); }
    
    .card-details { background: white; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1); display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e2e8f0; }
    
    .image-section { position: relative; height: 100%; min-height: 400px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); }
    .image-section img { width: 100%; height: 100%; object-fit: cover; }
    .image-section img.fallback-mode { object-fit: contain; padding: 1.25rem; }
    
    .hero-badge { position: absolute; top: 1.5rem; left: 1.5rem; background: #10b981; color: white; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .hero-badge.lost { background: #ef4444; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
    
    .info-section { padding: 3rem; }
    
    .category-tag { display: inline-block; background: #eff6ff; color: #3b82f6; padding: 0.4rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1rem; }
    
    h1 { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 2rem; line-height: 1.2; }
    
    .meta-data { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #e2e8f0; }
    .meta-item { display: flex; align-items: flex-start; gap: 1rem; }
    .meta-item i { font-size: 1.5rem; color: #3b82f6; background: #eff6ff; padding: 0.8rem; border-radius: 12px; }
    .meta-item strong { display: block; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem; }
    .meta-item p { color: #0f172a; font-weight: 600; font-size: 1.1rem; margin: 0; }
    
    .description-box h3 { font-size: 1.2rem; color: #0f172a; margin-bottom: 1rem; }
    .description-box p { color: #475569; line-height: 1.7; font-size: 1.05rem; background: #f8fafc; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; }
    
    .contact-card { margin-top: 2.5rem; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 2rem; border-radius: 20px; color: white; }
    .contact-card h3 { color: #f8fafc; margin-bottom: 1.5rem; font-size: 1.2rem; }
    .contact-info { display: flex; align-items: center; gap: 1rem; font-size: 1.2rem; font-weight: 600; margin-bottom: 1.5rem; background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 12px; }
    
    .btn-contact { width: 100%; background: white; color: #1e293b; border: none; padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
    .btn-contact:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    
    .loading-state { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    @media (max-width: 900px) {
      .card-details { grid-template-columns: 1fr; }
      .image-section { min-height: 300px; height: 300px; }
      .info-section { padding: 2rem; }
    }
  `]
})
export class LostDetailsComponent implements OnInit {
    item: LostItem | null = null;
  readonly fallbackImages: Record<'LOST' | 'FOUND', string> = {
    LOST: this.buildFallbackImage('LOST', '#ef4444'),
    FOUND: this.buildFallbackImage('FOUND', '#10b981')
  };

    constructor(
        private route: ActivatedRoute,
        private lostService: LostAndFoundService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.lostService.getItemById(Number(id)).subscribe({
                next: (data) => this.item = data,
                error: () => this.router.navigate(['/lost-found'])
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
