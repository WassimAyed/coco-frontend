import { Component, inject, effect, OnInit } from '@angular/core';
import { CollocationService } from '../../services/collocation.service';
import { UserService } from '../../../user-security/services/user.service';
import { UserApiService } from '../../../user-security/services/user-api.service';
import { SmartCollocationService } from '../../services/smart-collocation.service';

declare const bootstrap: any;

@Component({
  standalone: false,
  selector: 'app-mes-offres-requests',
  templateUrl: './mes-offres-request-colloc.component.html',
  styleUrls: ['./mes-offres-request-colloc.component.css']
})
export class MesOffresRequestsComponent implements OnInit {

  selectedMessage: string = '';

  private readonly userService = inject(UserService);
  private readonly userApiService = inject(UserApiService);
  private readonly collocationService = inject(CollocationService);
  private readonly smartService = inject(SmartCollocationService);

  readonly user = this.userService.currentUser;

  /** Map of studentId -> { firstName, lastName, email, avatarUrl } */
  senderProfiles: Map<number, any> = new Map();

  ownerId!: number;
  error = '';

  myRequests: any[] = [];
  paginatedRequests: any[] = [];

  currentPage = 1;
  totalPages = 1;

  private requestToDeleteId: number | null = null;

  ngOnInit(): void {
    // If user is already available
    const currentUser = this.user();
    if (!currentUser?.id) {
      this.error = 'User not authenticated';
      return;
    }

    this.ownerId = Number(currentUser.id);
    this.loadRequestsForMyOffers();
  }

  private readonly initEffect = effect(() => {
    const currentUser = this.user();
    if (!currentUser?.id) return;

    this.ownerId = Number(currentUser.id);
    this.loadRequestsForMyOffers();
  });

  // ============================
  // LOAD REQUESTS
  // ============================
  loadRequestsForMyOffers(): void {
    if (!this.ownerId) {
      this.error = 'User not authenticated';
      return;
    }

    this.collocationService.getMyOffers(this.ownerId).subscribe(offers => {
      const offerIds = offers.map(o => o.id);

      this.collocationService.getRequestsByOfferIds(offerIds).subscribe(requests => {
        this.myRequests = requests;
        this.setPage(1);
        this.loadSenderProfiles(requests);
        
        // Fetch AI smart rankings
        offers.forEach(o => this.loadRankings(o.id));
      });
    });
  }

  loadRankings(offerId: number): void {
    this.smartService.getApplicantRanking(offerId).subscribe(ranks => {
      ranks.forEach(rankObj => {
        // Find matching request and assign rank badge & score
        const reqs = this.myRequests.filter(r => r.offer.id === offerId && r.studentId === rankObj.studentId);
        reqs.forEach(req => {
          req.aiRankScore = rankObj.score;
          req.aiRankBadge = rankObj.badge;
        });
      });
    });
  }

  // ============================
  // PAGINATION
  // ============================
  setPage(page: number) {
    const pageSize = 5;
    this.totalPages = Math.ceil(this.myRequests.length / pageSize);

    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    const start = (page - 1) * pageSize;
    this.paginatedRequests = this.myRequests.slice(start, start + pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ============================
  // LOAD SENDER USER INFO
  // ============================
  private loadSenderProfiles(requests: any[]): void {
    const uniqueIds = [...new Set<number>(requests.map(r => r.studentId).filter(Boolean))];
    uniqueIds.forEach(id => {
      if (!this.senderProfiles.has(id)) {
        this.userApiService.getUserById(String(id)).then(profile => {
          this.senderProfiles.set(id, profile);
        }).catch(() => {
          this.senderProfiles.set(id, { firstName: 'Utilisateur', lastName: '#' + id, email: '', avatarUrl: '' });
        });
        
        // Load trust score for this student ID
        this.smartService.getTrustScore(id).subscribe(trustInfo => {
          // Store trust score inside sender profile if exists
          const currentProfile = this.senderProfiles.get(id);
          if (currentProfile) {
            currentProfile.trustScore = trustInfo.score;
            currentProfile.trustBadge = trustInfo.category;
            currentProfile.trustColor = trustInfo.color;
            this.senderProfiles.set(id, currentProfile);
          }
        });
      }
    });
  }

  getSenderProfile(studentId: number): any {
    return this.senderProfiles.get(studentId) ?? null;
  }

  // ============================
  // REQUEST ACTIONS
  // ============================
  acceptRequest(id: number) {
    this.collocationService.updateRequestStatus(id, 'ACCEPTEE', this.ownerId)
      .subscribe(() => {
        this.loadRequestsForMyOffers();
        this.showToast('Demande acceptée avec succès !', 'success');
      });
  }

  rejectRequest(id: number) {
    this.collocationService.updateRequestStatus(id, 'REJETEE', this.ownerId)
      .subscribe(() => {
        this.loadRequestsForMyOffers();
        this.showToast('Demande rejetée.', 'warning');
      });
  }

  // ============================
  // DELETE MODAL
  // ============================
  openDeleteModal(id: number) {
    this.requestToDeleteId = id;

    const modalEl = document.getElementById('deleteRequestModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const confirmBtn = modalEl.querySelector('#confirmDeleteBtn') as HTMLElement;

    const handler = () => {
      this.confirmDelete(modal);
      confirmBtn.removeEventListener('click', handler);
    };

    confirmBtn.addEventListener('click', handler);
  }

  private confirmDelete(modalInstance: any) {
    if (!this.requestToDeleteId) return;

    this.collocationService.deleteRequest(this.requestToDeleteId, this.ownerId)
      .subscribe({
        next: () => {
          this.loadRequestsForMyOffers();
          this.showToast('Demande supprimée avec succès !', 'success');
          modalInstance.hide();
          this.requestToDeleteId = null;
        },
        error: () => {
          this.showToast('Erreur lors de la suppression.', 'danger');
          modalInstance.hide();
        }
      });
  }

  // ============================
  // TOAST
  // ============================
  showToast(message: string, type: 'success' | 'danger' | 'warning') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }


showMessageModal: boolean = false;

openMessageModal(message: string) {
  this.selectedMessage = message;
  this.showMessageModal = true;
}

closeMessageModal() {
  this.showMessageModal = false;
}
}

