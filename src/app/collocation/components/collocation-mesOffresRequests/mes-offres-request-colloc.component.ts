import { Component, inject, effect, OnInit } from '@angular/core';
import { CollocationService } from '../../services/collocation.service';
import { UserService } from '../../../user-security/services/user.service';

declare const bootstrap: any;

@Component({
  selector: 'app-mes-offres-requests',
  templateUrl: './mes-offres-request-colloc.component.html',
  styleUrls: ['./mes-offres-request-colloc.component.css']
})
export class MesOffresRequestsComponent implements OnInit {

  selectedMessage: string = '';

  private readonly userService = inject(UserService);
  private readonly collocationService = inject(CollocationService);

  readonly user = this.userService.currentUser;

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
