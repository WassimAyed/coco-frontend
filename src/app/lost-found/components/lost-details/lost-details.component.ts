import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { ItemClaimResponse, LostItem } from '../../models/lost-item.model';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-lost-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="details-page" *ngIf="item">
      <!-- Standard App Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <span class="header-eyebrow">Item Overview</span>
            <h1 class="header-title">{{ item.title }}</h1>
            <p class="header-subtitle">Posted on {{ item.dateTime }}</p>
          </div>
          <button class="btn-outline" (click)="goBack()">
            <i class="bi bi-arrow-left"></i> Back to listings
          </button>
        </div>
        <div class="header-decoration">
          <div class="deco-circle deco-circle--1"></div>
          <div class="deco-circle deco-circle--2"></div>
        </div>
      </header>

      <div class="container main-content">
        <!-- Main Card Details -->
        <div class="clean-card item-split-card">
          <div class="item-visuals">
            <div class="image-wrapper">
              <img [src]="item.imageUrl || getFallbackByType(item.type)" (error)="onImageError($event, item.type)" alt="Item">
              <div class="type-badge-pill" [class.lost]="item.type === 'LOST'">
                {{ item.type === 'LOST' ? 'Lost Item' : 'Found Item' }}
              </div>
              <div class="status-overlay" *ngIf="item.status === 'RESOLVED'">Resolved</div>
            </div>
          </div>
          
          <div class="item-info-panel">
            <span class="category-tag">{{ item.category }}</span>
            <h2 class="item-main-title">{{ item.title }}</h2>
            
            <div class="quick-meta">
              <div class="meta-row">
                <i class="bi bi-geo-alt"></i>
                <div class="meta-text">
                  <span>Location</span>
                  <strong>{{ item.location }}</strong>
                </div>
              </div>
              <div class="meta-row">
                <i class="bi bi-person-badge"></i>
                <div class="meta-text">
                  <span>Contact</span>
                  <strong>{{ item.contactInfo }}</strong>
                </div>
              </div>
            </div>

            <div class="desc-box">
              <h4>Description</h4>
              <p>{{ item.description || 'No detailed description provided.' }}</p>
            </div>

            <!-- Interactivity Section -->
            <div class="actions-section">
              <div class="status-alert" *ngIf="showApprovedBadge()">
                <i class="bi bi-check-circle-fill"></i>
                <span>Claim Approved. Item returned to owner.</span>
              </div>

              <!-- General User Actions -->
              <div class="user-actions" *ngIf="!item.isOwner && !showApprovedBadge()">
                <div class="action-buttons">
                  <button class="btn-primary" [disabled]="!canCreateClaim()" (click)="toggleClaimForm()">
                    <i class="bi bi-shield-check"></i> Claim Item
                  </button>
                  <button class="btn-danger-ghost" (click)="toggleReportForm()">
                    <i class="bi bi-flag"></i> Report
                  </button>
                </div>

                <div class="inline-form claim-form" *ngIf="showClaimForm">
                  <label>Proof of ownership</label>
                  <textarea [(ngModel)]="claimMessage" placeholder="Describe unique identifying marks..."></textarea>
                  <button class="btn-dark" (click)="submitClaim(item.id)">Submit Claim</button>
                </div>

                <div class="inline-form report-form" *ngIf="showReportForm">
                  <label>Reason for report</label>
                  <input [(ngModel)]="reportReason" placeholder="Spam, scam, incorrect info...">
                  <button class="btn-danger" (click)="submitReport(item.id)">Send Report</button>
                </div>

                <div class="claim-notif" *ngIf="myClaimStatus">
                  <span class="notif-badge">Your request status: <strong>{{ myClaimStatus }}</strong></span>
                </div>
              </div>

              <!-- Owner Tracking -->
              <div class="owner-tracking" *ngIf="item.isOwner">
                <div class="owner-header">
                  <h4>Claim Requests</h4>
                </div>
                <div class="claims-list" *ngIf="ownerClaims.length > 0">
                  <div class="claim-row" *ngFor="let c of ownerClaims">
                    <div class="claim-details">
                      <strong>{{ getUserDisplayName(c.claimantUserId) }}</strong>
                      <p>{{ c.proofMessage }}</p>
                    </div>
                    <div class="claim-actions" *ngIf="c.status === 'PENDING'">
                      <button class="btn-approve" (click)="approveClaim(c.id, item.id)"><i class="bi bi-check-lg"></i></button>
                      <button class="btn-reject" (click)="rejectClaim(c.id, item.id)"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <span class="claim-status-pill" *ngIf="c.status !== 'PENDING'" [class.approved]="c.status === 'APPROVED'">{{ c.status }}</span>
                  </div>
                </div>
                <p class="empty-text" *ngIf="ownerClaims.length === 0">No requests yet.</p>
              </div>

              <!-- Admin Tracking -->
              <div class="admin-tracking" *ngIf="isAdmin && reportId">
                <h4>Admin Moderation</h4>
                <div class="admin-btns">
                  <button class="btn-approve" (click)="keepPost()">Keep Listing</button>
                  <button class="btn-reject" (click)="blockPost()">Block Listing</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Similarity Engine -->
        <div class="clean-card ai-engine-card" *ngIf="item">
          <div class="ai-header">
            <div class="ai-title">
              <i class="bi bi-robot"></i>
              <div>
                <h3>AI Similarity Check</h3>
                <p>Matching visual networks to find this item.</p>
              </div>
            </div>
            <button class="btn-refresh" (click)="loadAiProposals(item.id)" [disabled]="aiLoading">
              <i class="bi bi-arrow-clockwise" [class.spin]="aiLoading"></i> Refresh
            </button>
          </div>

          <div class="ai-matches-grid" *ngIf="!aiLoading && aiProposals.length > 0">
            <div class="ai-match-card" *ngFor="let p of aiProposals" (click)="viewProposal(p.candidate_post_id)">
              <div class="ai-img-wrap">
                <img [src]="p.imageUrl" alt="Match">
                <span class="ai-score">{{ (p.score * 100).toFixed(0) }}% Match</span>
              </div>
              <div class="ai-info">
                <h5>{{ p.title }}</h5>
                <span class="ai-type">{{ p.candidate_post_type }}</span>
              </div>
            </div>
          </div>
          
          <div class="ai-empty" *ngIf="!aiLoading && aiProposals.length === 0">
            <div class="empty-icon"><i class="bi bi-search"></i></div>
            <p>No similar items detected by the AI yet.</p>
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
    .details-page { min-height: 100vh; background: #fdfdfd; font-family: 'Outfit', sans-serif; padding-bottom: 5rem; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }

    /* Standard App Header */
    .page-header {
      position: relative;
      background: linear-gradient(135deg, #1a1a1a 0%, #262626 55%, #3d1417 100%);
      padding: 3.5rem 2.5rem 5rem;
      overflow: hidden;
      color: #fff;
    }
    .header-content { position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-eyebrow { display: inline-flex; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #f83441; background: rgba(248, 52, 65, 0.1); padding: 0.3rem 0.8rem; border-radius: 30px; border: 1px solid rgba(248, 52, 65, 0.3); margin-bottom: 0.8rem; }
    .header-title { font-size: 2.2rem; font-weight: 800; margin: 0; }
    .header-subtitle { color: rgba(255,255,255,0.6); margin: 0.4rem 0 0; }
    
    .btn-outline { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.7rem 1.2rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s; text-decoration: none; }
    .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

    .header-decoration { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
    .deco-circle { position: absolute; border-radius: 50%; background: #f83441; opacity: 0.08; }
    .deco-circle--1 { width: 400px; height: 400px; right: -100px; top: -150px; }
    .deco-circle--2 { width: 250px; height: 250px; left: 10%; bottom: -50px; opacity: 0.05; background: white; }

    /* Core Content Layout */
    .main-content { margin-top: -3rem; position: relative; z-index: 10; }
    .clean-card { background: white; border-radius: 28px; border: 1px solid #f1f5f9; box-shadow: 0 20px 40px rgba(0,0,0,0.06); overflow: hidden; margin-bottom: 2.5rem; }
    
    .item-split-card { display: grid; grid-template-columns: 1fr 1fr; }
    
    .image-wrapper { height: 100%; min-height: 450px; position: relative; background: #f8fafc; }
    .image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
    .image-wrapper img.fallback-mode { object-fit: contain; padding: 3rem; }
    .type-badge-pill { position: absolute; top: 1.5rem; left: 1.5rem; background: #10b981; color: white; padding: 0.5rem 1.2rem; border-radius: 30px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
    .type-badge-pill.lost { background: #f83441; box-shadow: 0 4px 15px rgba(248, 52, 65, 0.3); }
    .status-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; text-transform: uppercase; font-size: 1.5rem; pointer-events: none; }

    .item-info-panel { padding: 3rem; display: flex; flex-direction: column; }
    .category-tag { display: inline-block; font-size: 0.75rem; font-weight: 800; color: #f83441; background: rgba(248,52,65,0.08); padding: 0.3rem 0.8rem; border-radius: 6px; text-transform: uppercase; margin-bottom: 1rem; width: fit-content; }
    .item-main-title { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0 0 2rem; line-height: 1.2; }
    
    .quick-meta { display: grid; grid-template-columns: 1fr; gap: 1.25rem; margin-bottom: 2.5rem; }
    .meta-row { display: flex; align-items: center; gap: 1.2rem; }
    .meta-row i { font-size: 1.4rem; color: #f83441; background: #fff1f2; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 12px; }
    .meta-text span { display: block; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem; }
    .meta-text strong { font-size: 1.05rem; color: #1e293b; }

    .desc-box { margin-bottom: 3rem; }
    .desc-box h4 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0 0 0.8rem; }
    .desc-box p { color: #475569; line-height: 1.7; font-size: 1rem; margin: 0; }

    /* Actions */
    .actions-section { margin-top: auto; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
    .status-alert { background: #f0fdf4; color: #166534; padding: 1rem; border-radius: 14px; font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 0.75rem; }
    
    .action-buttons { display: flex; gap: 1rem; }
    .btn-primary { flex: 1; padding: 1rem; background: #f83441; color: white; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: 0.3s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(248, 52, 65, 0.25); background: #e02d38; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-danger-ghost { padding: 1rem 1.5rem; background: transparent; color: #991b1b; border: 1px solid #fecaca; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-danger-ghost:hover { background: #fef2f2; }

    .inline-form { margin-top: 1.5rem; background: #f8fafc; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; }
    .inline-form label { font-size: 0.8rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 0.5rem; text-transform: uppercase; }
    .inline-form textarea, .inline-form input { width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; background: white; padding: 0.8rem; margin-bottom: 1rem; font-family: inherit; }
    .btn-dark { width: 100%; background: #1e293b; color: white; border: none; padding: 0.8rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
    .btn-danger { width: 100%; background: #ef4444; color: white; border: none; padding: 0.8rem; border-radius: 12px; font-weight: 700; cursor: pointer; }

    .claim-notif { margin-top: 1rem; }
    .notif-badge { background: #f1f5f9; color: #475569; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; display: inline-block; }
    .notif-badge strong { color: #1e293b; }

    /* Lists */
    .owner-tracking h4, .admin-tracking h4 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0 0 1rem; }
    .claim-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
    .claim-details strong { font-size: 0.95rem; color: #1e293b; }
    .claim-details p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #64748b; }
    .claim-actions { display: flex; gap: 0.5rem; }
    .btn-approve, .btn-reject { width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; transition: 0.2s; font-weight: 700; display: grid; place-items: center; }
    .btn-approve { background: #dcfce7; color: #166534; }
    .btn-reject { background: #fee2e2; color: #991b1b; }
    .admin-btns { display: flex; gap: 1rem; }
    .admin-btns button { width: auto; padding: 0 1.5rem; }
    .claim-status-pill { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; background: #f1f5f9; padding: 0.3rem 0.6rem; border-radius: 6px; }
    .claim-status-pill.approved { color: #166534; background: #dcfce7; }
    .empty-text { color: #94a3b8; font-size: 0.9rem; }

    /* AI Section */
    .ai-engine-card { padding: 2.5rem; }
    .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .ai-title { display: flex; align-items: center; gap: 1rem; }
    .ai-title i { font-size: 2rem; color: #1e293b; }
    .ai-title h3 { margin: 0 0 0.2rem; font-weight: 800; color: #1e293b; }
    .ai-title p { margin: 0; font-size: 0.9rem; color: #64748b; }
    .btn-refresh { border: 1px solid #e2e8f0; background: white; color: #1e293b; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.2s; }
    .btn-refresh:hover { border-color: #cbd5e1; background: #f8fafc; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .ai-matches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
    .ai-match-card { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; cursor: pointer; transition: 0.3s; }
    .ai-match-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: #cbd5e1; }
    .ai-img-wrap { height: 140px; position: relative; background: #f8fafc; }
    .ai-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .ai-score { position: absolute; top: 0.75rem; right: 0.75rem; background: #1e293b; color: white; font-size: 0.7rem; font-weight: 800; padding: 0.3rem 0.6rem; border-radius: 8px; }
    .ai-info { padding: 1.25rem; }
    .ai-info h5 { margin: 0 0 0.4rem; font-size: 0.95rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ai-type { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
    
    .ai-empty { text-align: center; padding: 3rem; color: #94a3b8; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.5; }

    /* Utilities & Loading */
    .loading-state { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fdfdfd; font-family: 'Outfit'; }
    .spinner { width: 44px; height: 44px; border: 4px solid #e2e8f0; border-top-color: #f83441; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }

    @media (max-width: 900px) {
      .item-split-card { grid-template-columns: 1fr; }
      .image-wrapper { min-height: 300px; height: 300px; }
      .item-info-panel { padding: 2rem; }
    }
  `]
})
export class LostDetailsComponent implements OnInit {
  item: LostItem | null = null;
  reportId: number | null = null;
  isAdmin = false;
  moderationBusy = false;
  showClaimForm = false;
  showReportForm = false;
  claimMessage = '';
  reportReason = '';
  reportDetails = '';
  actionMessage = '';
  ownerClaims: ItemClaimResponse[] = [];
  myClaimStatus: ItemClaimResponse['status'] | null = null;
  aiProposals: any[] = [];
  aiLoading = false;
  userNames: Record<number, string> = {};
  readonly fallbackImages: Record<'LOST' | 'FOUND', string> = {
    LOST: this.buildFallbackImage('LOST', '#ef4444'),
    FOUND: this.buildFallbackImage('FOUND', '#10b981')
  };

  constructor(
    private route: ActivatedRoute,
    private lostService: LostAndFoundService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isAdmin = (this.userService.currentUser()?.role || '').toLowerCase().includes('admin');
    const reportIdParam = this.route.snapshot.queryParamMap.get('reportId');
    this.reportId = reportIdParam ? Number(reportIdParam) : null;

    // Listen to route param changes to support navigating between similar items
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadItemDetails(Number(id));
      }
    });
  }

  loadItemDetails(id: number): void {
    this.lostService.getItemById(id).subscribe({
      next: (data) => {
        this.item = data;
        this.aiProposals = data.aiProposals || [];

        if (data?.isOwner && data?.id) {
          this.loadOwnerClaims(data.id);
        } else if (data?.id) {
          this.loadMyClaimStatus(data.id);
        }
      },
      error: () => this.router.navigate(['/lost-found'])
    });
  }

  viewProposal(id: number): void {
    this.router.navigate(['/lost-found/details', id]);
    // The paramMap subscription in ngOnInit will handle the reload
  }

  goBack(): void {
    if (this.isAdmin && this.reportId) {
      this.router.navigate(['/admin'], { queryParams: { module: 'item-reports' } });
      return;
    }

    this.router.navigate(['/lost-found']);
  }

  keepPost(): void {
    if (!this.isAdmin || !this.reportId) {
      return;
    }

    this.moderationBusy = true;
    this.lostService.reviewReport(this.reportId, {
      status: 'REVIEWED',
      moderatorComment: 'Reviewed by admin. Item remains visible.'
    }).subscribe({
      next: () => {
        this.moderationBusy = false;
        this.actionMessage = 'Post kept successfully.';
      },
      error: (err) => {
        this.moderationBusy = false;
        this.actionMessage = err?.error?.message || 'Unable to keep post.';
      }
    });
  }

  blockPost(): void {
    if (!this.isAdmin || !this.reportId) {
      return;
    }

    this.moderationBusy = true;
    this.lostService.reviewReport(this.reportId, {
      status: 'ACTION_TAKEN',
      moderatorComment: 'Item blocked by admin after report review.'
    }).subscribe({
      next: () => {
        this.moderationBusy = false;
        if (this.item) {
          this.item = { ...this.item, status: 'BLOCKED' };
        }
        this.actionMessage = 'Post blocked successfully.';
      },
      error: (err) => {
        this.moderationBusy = false;
        this.actionMessage = err?.error?.message || 'Unable to block post.';
      }
    });
  }

  loadAiProposals(itemId: number): void {
    this.aiLoading = true;
    this.lostService.getAiProposals(itemId, 5).subscribe({
      next: (data) => {
        this.aiProposals = data || [];
        this.aiLoading = false;
      },
      error: () => {
        this.aiProposals = [];
        this.aiLoading = false;
      }
    });
  }

  loadOwnerClaims(itemId: number): void {
    this.lostService.getClaimsForMyItem(itemId).subscribe({
      next: (claims) => {
        this.ownerClaims = claims || [];
        this.resolveClaimantNames(this.ownerClaims);
      },
      error: (err) => {
        this.actionMessage = err?.error?.message || 'Unable to load claim requests.';
      }
    });
  }

  approveClaim(claimId: number, itemId: number): void {
    const comment = window.prompt('Optional approval comment:') || '';
    this.lostService.approveClaim(claimId, { comment }).subscribe({
      next: () => {
        this.actionMessage = 'Claim approved.';
        this.loadOwnerClaims(itemId);
      },
      error: (err) => {
        this.actionMessage = err?.error?.message || 'Unable to approve claim.';
      }
    });
  }

  rejectClaim(claimId: number, itemId: number): void {
    const comment = window.prompt('Optional rejection comment:') || '';
    this.lostService.rejectClaim(claimId, { comment }).subscribe({
      next: () => {
        this.actionMessage = 'Claim rejected.';
        this.loadOwnerClaims(itemId);
      },
      error: (err) => {
        this.actionMessage = err?.error?.message || 'Unable to reject claim.';
      }
    });
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

  toggleClaimForm(): void {
    this.showClaimForm = !this.showClaimForm;
    if (this.showClaimForm) {
      this.showReportForm = false;
    }
  }

  toggleReportForm(): void {
    this.showReportForm = !this.showReportForm;
    if (this.showReportForm) {
      this.showClaimForm = false;
    }
  }

  submitClaim(itemId: number): void {
    if (!this.canCreateClaim()) {
      this.actionMessage = this.getClaimDisabledReason();
      return;
    }

    if (!this.claimMessage.trim()) {
      this.actionMessage = 'Please provide a proof message.';
      return;
    }

    this.lostService.createClaim(itemId, { proofMessage: this.claimMessage.trim() }).subscribe({
      next: () => {
        this.actionMessage = 'Claim submitted successfully.';
        this.claimMessage = '';
        this.showClaimForm = false;
        this.loadMyClaimStatus(itemId);
      },
      error: (err) => {
        this.actionMessage = err?.error?.message || 'Unable to submit claim.';
      }
    });
  }

  submitReport(itemId: number): void {
    if (!this.reportReason.trim()) {
      this.actionMessage = 'Please provide a reason for report.';
      return;
    }

    this.lostService.createReport(itemId, {
      reason: this.reportReason.trim(),
      details: this.reportDetails?.trim() || undefined
    }).subscribe({
      next: () => {
        this.actionMessage = 'Report submitted. Thank you.';
        this.reportReason = '';
        this.reportDetails = '';
        this.showReportForm = false;
      },
      error: (err) => {
        this.actionMessage = err?.error?.message || 'Unable to submit report.';
      }
    });
  }

  private loadMyClaimStatus(itemId: number): void {
    this.lostService.getMyClaims().subscribe({
      next: (claims) => {
        const itemClaims = (claims || []).filter(c => c.itemId === itemId);
        if (itemClaims.length === 0) {
          this.myClaimStatus = null;
          return;
        }

        const priority: Record<ItemClaimResponse['status'], number> = {
          APPROVED: 4,
          PENDING: 3,
          REJECTED: 2,
          CANCELED: 1
        };

        const top = itemClaims.sort((a, b) => priority[b.status] - priority[a.status])[0];
        this.myClaimStatus = top?.status || null;
      },
      error: () => {
        this.myClaimStatus = null;
      }
    });
  }

  canCreateClaim(): boolean {
    if (!this.item || this.item.isOwner) {
      return false;
    }
    if (this.item.status !== 'ACTIVE') {
      return false;
    }
    return this.myClaimStatus !== 'APPROVED' && this.myClaimStatus !== 'PENDING';
  }

  showApprovedBadge(): boolean {
    return !this.item?.isOwner && (this.myClaimStatus === 'APPROVED' || this.item?.status === 'RESOLVED');
  }

  private getClaimDisabledReason(): string {
    if (!this.item) {
      return 'Item not loaded.';
    }
    if (this.item.status !== 'ACTIVE') {
      return 'This item is not active anymore.';
    }
    if (this.myClaimStatus === 'APPROVED') {
      return 'Your request is already approved.';
    }
    if (this.myClaimStatus === 'PENDING') {
      return 'You already have a pending request for this item.';
    }
    return 'You cannot submit a new request.';
  }

  private resolveClaimantNames(claims: ItemClaimResponse[]): void {
    const ids = Array.from(new Set((claims || []).map(c => c.claimantUserId).filter(Boolean)));
    ids.forEach((id) => {
      if (this.userNames[id]) {
        return;
      }
      this.userService.getProfileByUserId(id).subscribe((profile) => {
        if (profile) {
          const first = profile.firstName || profile.username || '';
          const last = profile.lastName || profile.lastname || '';
          const full = `${first} ${last}`.trim();
          this.userNames[id] = full || profile.email || `User ${id}`;
        } else {
          this.userNames[id] = `User ${id}`;
        }
      });
    });
  }

  getUserDisplayName(userId: number): string {
    return this.userNames[userId] || `User ${userId}`;
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
