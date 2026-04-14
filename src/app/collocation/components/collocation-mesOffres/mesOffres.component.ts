import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-mes-offres',
  templateUrl: './mesOffres.component.html',
  styleUrls: ['./mesOffres.component.css']
})
export class MesOffresComponent implements OnInit {

  myOffers: any[] = [];
  filteredOffers: any[] = [];
  paginatedOffers: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  get activeOffersCount(): number {
    return this.myOffers.filter(o => !o.expired).length;
  }

  selectedOffer: any = {};
  selectedOfferId: number | null = null;

  showDeleteModal = false;
  showUpdateModal = false;
  isUpdating = false;

  updateForm: FormGroup;

  constructor(
    private collocationService: CollocationService,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      ville: ['', [Validators.required]],
      prixLoc: [0, [Validators.required, Validators.min(1)]],
      chambres: [1, [Validators.required, Validators.min(1)]],
      meublee: [false],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadMyOffers();
  }

  loadMyOffers() {
    const ownerId = Number(localStorage.getItem('userId'));
    if (!ownerId) return;

    this.collocationService.getMyOffers(ownerId).subscribe({
      next: data => {
        this.myOffers = data || [];
        this.filteredOffers = [...this.myOffers];
        this.updatePagination();
      },
      error: err => console.error(err)
    });
  }

  filterOffers() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredOffers = [...this.myOffers];
    } else {
      this.filteredOffers = this.myOffers.filter(o =>
        o.titre?.toLowerCase().includes(term) ||
        o.ville?.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term)
      );
    }
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredOffers.length / this.itemsPerPage);
    this.setPage(1);
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedOffers = this.filteredOffers.slice(start, end);
  }

  openDeleteModal(id: number) {
    this.selectedOfferId = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.selectedOfferId) return;

    this.collocationService.deleteOffer(this.selectedOfferId).subscribe({
      next: () => {
        this.myOffers = this.myOffers.filter(o => o.id !== this.selectedOfferId);
        this.filterOffers(); // re-apply search filter & pagination
        this.showDeleteModal = false;
      },
      error: err => console.error(err)
    });
  }

  openUpdateModal(offer: any) {
    this.selectedOffer = { ...offer };
    this.updateForm.patchValue({
      titre: offer.titre,
      ville: offer.ville,
      prixLoc: offer.prixLoc,
      chambres: offer.chambres,
      meublee: offer.meublee,
      description: offer.description
    });
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.isUpdating = false;
  }

  confirmUpdate() {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    if (!this.selectedOffer?.id) return;

    this.isUpdating = true;

    // Ensure numbers are properly typed before sending to backend
    const formVals = this.updateForm.value;
    const payload = {
      ...this.selectedOffer,
      ...formVals,
      prixLoc: Number(formVals.prixLoc),
      chambres: Number(formVals.chambres),
      meublee: !!formVals.meublee
    };

    this.collocationService.updateOffer(this.selectedOffer.id, payload)
      .subscribe({
        next: (response) => {
          // If the backend returns the full object we use it, otherwise fallback to our payload
          const resAny = response as any;
          const updated = (resAny && resAny.id) ? resAny : payload;
          
          // Update the item in myOffers
          const index = this.myOffers.findIndex(o => o.id === this.selectedOffer.id);
          if (index !== -1) {
            this.myOffers[index] = { ...this.myOffers[index], ...updated };
          }
          
          // Apply changes to filteredOffers too
          const filteredIndex = this.filteredOffers.findIndex(o => o.id === this.selectedOffer.id);
          if (filteredIndex !== -1) {
             this.filteredOffers[filteredIndex] = { ...this.filteredOffers[filteredIndex], ...updated };
          }
          
          // Refresh current page view
          this.setPage(this.currentPage);
          
          this.isUpdating = false;
          this.showUpdateModal = false;
        },
        error: err => {
          console.error('Erreur mise à jour', err);
          this.isUpdating = false;
        }
      });
  }
}
