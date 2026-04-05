import { Component, OnInit } from '@angular/core';
import { CollocationService } from '../../services/collocation.service';

declare const bootstrap: any; // <-- pour utiliser Bootstrap JS

@Component({
  standalone: false,
  selector: 'app-mes-offres-requests',
  templateUrl: './mes-offres-request-colloc.component.html',
  styleUrls: ['./mes-offres-request-colloc.component.css']
})
export class MesOffresRequestsComponent implements OnInit {

  myRequests: any[] = [];
  paginatedRequests: any[] = [];

  currentPage = 1;
  totalPages = 1;

  private requestToDeleteId: number | null = null; // id de la demande à supprimer

  constructor(private collocationService: CollocationService) {}

  ngOnInit(): void {
    this.loadRequestsForMyOffers();
  }

  // Pagination
  setPage(page: number) {
    const pageSize = 5;
    this.totalPages = Math.ceil(this.myRequests.length / pageSize);

    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    const start = (page - 1) * pageSize;
    this.paginatedRequests = this.myRequests.slice(start, start + pageSize);
  }

  // Accept request
  acceptRequest(id: number) {
    this.collocationService.updateRequestStatus(id, 'ACCEPTEE')
      .subscribe(() => {
        this.loadRequestsForMyOffers();
        this.showToast('Demande acceptée avec succès !', 'success');
      });
  }

  // Reject request
  rejectRequest(id: number) {
    this.collocationService.updateRequestStatus(id, 'REJETEE')
      .subscribe(() => {
        this.loadRequestsForMyOffers();
        this.showToast('Demande rejetée.', 'warning');
      });
  }

  // Ouvrir le modal de confirmation suppression
  openDeleteModal(id: number) {
    this.requestToDeleteId = id;
    const modalEl = document.getElementById('deleteRequestModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const confirmBtn = modalEl.querySelector('#confirmDeleteBtn') as HTMLElement;

    const handler = () => {
      this.confirmDelete(modal);
      confirmBtn.removeEventListener('click', handler); // remove listener after use
    };

    confirmBtn.addEventListener('click', handler);
  }

  // Confirmer la suppression
  private confirmDelete(modalInstance: any) {
    if (!this.requestToDeleteId) return;

  this.collocationService.deleteRequest(this.requestToDeleteId).subscribe({
    next: () => {
        this.loadRequestsForMyOffers();
        this.showToast('Demande supprimée avec succès !', 'success');
        modalInstance.hide();
        this.requestToDeleteId = null;
    },
    error: (err) => {
        console.error('Backend error:', err);
        this.showToast('Erreur lors de la suppression.', 'danger');
        modalInstance.hide();
    }
});
  }

  // Toast générique
  showToast(message: string, type: 'success' | 'danger' | 'warning') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }

  // Charger les demandes
  loadRequestsForMyOffers() {
    const ownerId = Number(localStorage.getItem('userId'));
    if (!ownerId) return;

    this.collocationService.getMyOffers(ownerId).subscribe(offers => {
      const offerIds = offers.map((o: any) => o.id);

      this.collocationService.getRequestsByOfferIds(offerIds)
        .subscribe((requests: any[]) => {
          this.myRequests = requests;
          this.setPage(1);
        });
    });
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}

