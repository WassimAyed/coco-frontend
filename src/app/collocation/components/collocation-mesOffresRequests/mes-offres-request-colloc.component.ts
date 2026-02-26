import { Component, OnInit } from '@angular/core';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-mes-offres-requests',
  templateUrl: './mes-offres-request-colloc.component.html',
  styleUrls: ['./mes-offres-request-colloc.component.css']
})
export class MesOffresRequestsComponent implements OnInit {

  myRequests: any[] = [];
  paginatedRequests: any[] = [];

  currentPage = 1;
  totalPages = 1;

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
      .subscribe(() => this.loadRequestsForMyOffers());
  }

  // Reject request
  rejectRequest(id: number) {
    this.collocationService.updateRequestStatus(id, 'REJETEE')
      .subscribe(() => this.loadRequestsForMyOffers());
  }

  // Delete request
  deleteRequest(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cette demande ?')) {
      this.collocationService.deleteRequest(id)
        .subscribe(() => this.loadRequestsForMyOffers());
    }
  }

  // Step 1 & 2: Get all offers posted by current owner
  // Step 3: Fetch requests for those offers
  loadRequestsForMyOffers() {
    const ownerId = Number(localStorage.getItem('ownerId'));
    if (!ownerId) return;

    this.collocationService.getMyOffers(ownerId).subscribe(offers => {
      const offerIds = offers.map((o: any) => o.id);

      // Get all requests whose offerId is in this array
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
