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
    <div class="details-container" *ngIf="item">
      <div class="details-wrapper">
        <button class="btn-back" (click)="goBack()">
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
              <div class="status-banner" *ngIf="showApprovedBadge()">
                <span class="status-badge approved">Claim approved • Item found</span>
              </div>

              <div class="actions-grid" *ngIf="!item.isOwner && !showApprovedBadge()">
                <button class="btn-contact" [disabled]="!canCreateClaim()" (click)="toggleClaimForm()">Claim this item</button>
                <button class="btn-report" (click)="toggleReportForm()">Report this listing</button>
              </div>

              <div class="claim-state" *ngIf="!item.isOwner && myClaimStatus && !showApprovedBadge()">
                <span class="claim-badge" [class.pending]="myClaimStatus === 'PENDING'">Your request: {{ myClaimStatus }}</span>
              </div>

              <div class="inline-form" *ngIf="showClaimForm && !item.isOwner && canCreateClaim() && !showApprovedBadge()">
                <label>Proof message</label>
                <textarea [(ngModel)]="claimMessage" rows="3" placeholder="Describe proof of ownership..."></textarea>
                <button class="btn-contact" (click)="submitClaim(item.id)">Submit claim</button>
              </div>

              <div class="inline-form" *ngIf="showReportForm && !item.isOwner && !showApprovedBadge()">
                <label>Reason</label>
                <input [(ngModel)]="reportReason" placeholder="Spam, scam, inappropriate...">
                <label>Details</label>
                <textarea [(ngModel)]="reportDetails" rows="3" placeholder="Additional context"></textarea>
                <button class="btn-report" (click)="submitReport(item.id)">Submit report</button>
              </div>

              <p class="status-msg" *ngIf="actionMessage">{{ actionMessage }}</p>

              <div class="admin-moderation" *ngIf="isAdmin && reportId">
                <h3>Admin moderation</h3>
                <div class="admin-actions">
                  <button class="btn-keep" [disabled]="moderationBusy" (click)="keepPost()">Keep Post</button>
                  <button class="btn-block" [disabled]="moderationBusy || item.status === 'BLOCKED'" (click)="blockPost()">Block Post</button>
                </div>
              </div>
            </div>

            <div class="owner-claims" *ngIf="item.isOwner">
              <div class="owner-claims-head">
                <h3>Claim requests</h3>
                <button class="btn-refresh" (click)="loadOwnerClaims(item.id)">Refresh</button>
              </div>

              <div *ngIf="ownerClaims.length === 0" class="owner-empty">No claim requests yet.</div>

              <div class="owner-claim-row" *ngFor="let claim of ownerClaims">
                <div>
                  <strong>{{ getUserDisplayName(claim.claimantUserId) }}</strong>
                  <p>{{ claim.proofMessage }}</p>
                </div>
                <div class="owner-claim-actions">
                  <span class="claim-badge" [class.pending]="claim.status === 'PENDING'">{{ claim.status }}</span>
                  <button class="btn-approve" *ngIf="claim.status === 'PENDING'" (click)="approveClaim(claim.id, item.id)">Approve</button>
                  <button class="btn-reject" *ngIf="claim.status === 'PENDING'" (click)="rejectClaim(claim.id, item.id)">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ✨ AI Similar Items Section -->
      <div class="ai-section" *ngIf="item">
        <div class="ai-header">
          <div class="ai-title">
            <div class="ai-icon">🤖</div>
            <div>
              <h2>AI Similarity Engine</h2>
              <p>{{ item.type === 'LOST' ? 'Matching FOUND items that look similar to this lost object' : 'Matching LOST items that look similar to this found object' }}</p>
            </div>
          </div>
          <button class="btn-ai-refresh" (click)="loadAiProposals(item.id)" [disabled]="aiLoading">
            <span *ngIf="!aiLoading">🔄 Refresh</span>
            <span *ngIf="aiLoading">⏳ Scanning...</span>
          </button>
        </div>

        <div class="ai-loading" *ngIf="aiLoading">
          <div class="ai-spinner"></div>
          <p>Neural network scanning for visual similarities...</p>
        </div>

        <div class="ai-empty" *ngIf="!aiLoading && aiProposals.length === 0">
          <span class="ai-empty-icon">🔍</span>
          <p>No visually similar items found yet. The AI index will grow as more posts are added.</p>
        </div>

        <div class="ai-grid" *ngIf="!aiLoading && aiProposals.length > 0">
          <div class="ai-card" *ngFor="let proposal of aiProposals; let i = index">
            <div class="ai-card-rank">#{{ i + 1 }}</div>
            <div class="ai-card-image" *ngIf="proposal.imageUrl">
              <img [src]="proposal.imageUrl" alt="Proposal preview">
            </div>
            <div class="ai-card-body">
              <div class="ai-score-bar">
                <div class="ai-score-fill" [style.width]="(proposal.score * 100) + '%'" [class.high]="proposal.score >= 0.7" [class.medium]="proposal.score >= 0.5 && proposal.score < 0.7"></div>
              </div>
              <div class="ai-card-info">
                <span class="ai-type-badge" [class.found]="proposal.candidate_post_type === 'FOUND'">{{ proposal.candidate_post_type }}</span>
                <span class="ai-score-label">{{ (proposal.score * 100).toFixed(1) }}% match</span>
              </div>
              <h4 class="ai-proposal-title">{{ proposal.title || 'Untitled item' }}</h4>
              <p class="ai-post-id">Post ID: <strong>{{ proposal.candidate_post_id }}</strong></p>
              <button class="btn-ai-view" (click)="viewProposal(proposal.candidate_post_id)">View post →</button>
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
    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
    
    .btn-contact { width: 100%; background: white; color: #1e293b; border: none; padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
    .btn-contact:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    .btn-report { width: 100%; background: #fecaca; color: #7f1d1d; border: none; padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; }
    .inline-form { display: flex; flex-direction: column; gap: 0.55rem; margin-top: 0.8rem; }
    .inline-form label { font-size: 0.85rem; font-weight: 700; color: #cbd5e1; }
    .inline-form textarea, .inline-form input { border-radius: 10px; border: 1px solid rgba(255,255,255,0.3); padding: 0.65rem 0.8rem; background: rgba(255,255,255,0.08); color: white; }
    .inline-form textarea::placeholder, .inline-form input::placeholder { color: #cbd5e1; }
    .status-msg { margin-top: 0.8rem; font-size: 0.9rem; color: #bfdbfe; }
    .status-banner { margin-bottom: 1rem; }
    .status-badge { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 999px; padding: 0.45rem 0.75rem; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.2px; }
    .status-badge.approved { background: #dcfce7; color: #166534; }
    .claim-state { margin-bottom: 0.8rem; }
    .admin-moderation { margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 1rem; }
    .admin-moderation h3 { font-size: 0.95rem; margin: 0 0 0.6rem; color: #cbd5e1; }
    .admin-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    .btn-keep, .btn-block { border: none; border-radius: 10px; padding: 0.7rem 0.8rem; font-weight: 700; cursor: pointer; }
    .btn-keep { background: #dcfce7; color: #166534; }
    .btn-block { background: #fee2e2; color: #991b1b; }
    .btn-keep:disabled, .btn-block:disabled { opacity: 0.55; cursor: not-allowed; }

    .owner-claims { margin-top: 1.25rem; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; background: #f8fafc; }
    .owner-claims-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
    .owner-claims-head h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
    .btn-refresh { border: 1px solid #cbd5e1; background: white; color: #334155; border-radius: 8px; padding: 0.4rem 0.7rem; font-weight: 600; cursor: pointer; }
    .owner-empty { color: #64748b; font-size: 0.9rem; }
    .owner-claim-row { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; border-top: 1px solid #e2e8f0; padding: 0.7rem 0; }
    .owner-claim-row p { margin: 0.2rem 0 0; color: #475569; font-size: 0.92rem; }
    .owner-claim-actions { display: flex; align-items: center; gap: 0.45rem; }
    .claim-badge { background: #e2e8f0; color: #0f172a; border-radius: 999px; padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 700; }
    .claim-badge.pending { background: #fef3c7; color: #92400e; }
    .btn-approve, .btn-reject { border: none; border-radius: 8px; padding: 0.4rem 0.7rem; font-weight: 700; cursor: pointer; }
    .btn-approve { background: #dcfce7; color: #166534; }
    .btn-reject { background: #fee2e2; color: #991b1b; }
    
    .loading-state { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* AI Section */
    .ai-section { margin-top: 2.5rem; background: white; border-radius: 28px; padding: 2.5rem; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px -8px rgba(0,0,0,0.08); }
    .ai-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .ai-title { display: flex; align-items: center; gap: 1.2rem; }
    .ai-icon { font-size: 2.5rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 16px; flex-shrink: 0; }
    .ai-title h2 { margin: 0 0 0.3rem; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .ai-title p { margin: 0; color: #64748b; font-size: 0.92rem; max-width: 500px; }
    .btn-ai-refresh { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .btn-ai-refresh:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.35); }
    .btn-ai-refresh:disabled { opacity: 0.65; cursor: not-allowed; }
    .ai-loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: #6366f1; }
    .ai-spinner { width: 44px; height: 44px; border: 4px solid #e0e7ff; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    .ai-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; color: #94a3b8; text-align: center; }
    .ai-empty-icon { font-size: 3rem; }
    .ai-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.2rem; }
    .ai-card { border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; transition: all 0.25s; position: relative; background: #fafbff; }
    .ai-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px -8px rgba(99,102,241,0.2); border-color: #a5b4fc; }
    .ai-card-rank { position: absolute; top: 0.75rem; right: 0.75rem; background: #312e81; color: white; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 8px; }
    .ai-card-body { padding: 1.5rem; }
    .ai-score-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 1rem; }
    .ai-score-fill { height: 100%; border-radius: 999px; background: #94a3b8; transition: width 0.6s ease; }
    .ai-score-fill.medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .ai-score-fill.high { background: linear-gradient(90deg, #10b981, #34d399); }
    .ai-card-info { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .ai-type-badge { font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; background: #fee2e2; color: #991b1b; text-transform: uppercase; }
    .ai-type-badge.found { background: #dcfce7; color: #166534; }
    .ai-score-label { font-size: 0.85rem; font-weight: 700; color: #475569; }
    .ai-post-id { color: #64748b; font-size: 0.88rem; margin: 0 0 1rem; }
    .btn-ai-view { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.65rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
    .btn-ai-view:hover { opacity: 0.9; transform: translateY(-1px); }

    .ai-card-image { height: 140px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
    .ai-card-image img { width: 100%; height: 100%; object-fit: cover; }
    .ai-proposal-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 700; color: #1e293b; 
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    
    @media (max-width: 900px) {
      .card-details { grid-template-columns: 1fr; }
      .image-section { min-height: 300px; height: 300px; }
      .info-section { padding: 2rem; }
      .ai-section { padding: 1.5rem; }
      .ai-title h2 { font-size: 1.2rem; }
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
