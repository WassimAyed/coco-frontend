import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollocationService } from '../../services/collocation.service';

// http://localhost:4200/collocation/mesOffres

@Component({
  selector: 'app-mes-offres',
  templateUrl: './mesOffres.component.html',
  styleUrls: ['./mesOffres.component.css']
})
export class MesOffresComponent implements OnInit {
  myOffers: any[] = [];
  paginatedOffers: any[] = [];
  currentPage = 1;
  totalPages = 1;

  // DELETE modal
  showDeleteModal = false;
  selectedOfferId!: number;

  // UPDATE modal
  showUpdateModal = false;
  updateForm!: FormGroup;

  constructor(private collocationService: CollocationService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadMyOffers();

    // Initialize the update form
    this.updateForm = this.fb.group({
      titre: ['', Validators.required],
      ville: ['', Validators.required],
      prixLoc: [0, Validators.required],
      chambres: [1, Validators.required],
      meublee: [false],
      description: ['']
    });
  }

  // Load offers
  loadMyOffers() {
    this.collocationService.getAllOffers().subscribe((data: any[]) => {
      this.myOffers = data;
      this.setPage(this.currentPage);
    });
  }

  // Pagination
  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    const pageSize = 5;
    this.totalPages = Math.ceil(this.myOffers.length / pageSize);
    const start = (this.currentPage - 1) * pageSize;
    this.paginatedOffers = this.myOffers.slice(start, start + pageSize);
  }

  // ------------------ DELETE MODAL ------------------
  openDeleteModal(id: number) {
    this.selectedOfferId = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.selectedOfferId) return;

    this.collocationService.deleteOffer(this.selectedOfferId).subscribe(() => {
      this.closeDeleteModal();
      this.loadMyOffers();
    });
  }

  // ------------------ UPDATE MODAL ------------------
  openUpdateModal(offer: any) {
    this.selectedOfferId = offer.id;
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
  }

  submitUpdate() {
  if (this.updateForm.invalid) return;

  const updatedData = this.updateForm.value;

  // ---------------- Add expiration logic ----------------
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setMonth(expiryDate.getMonth() + 1); // +1 month

  // Format to yyyy-MM-dd for backend
  const formattedExpiry = expiryDate.toISOString().split('T')[0];
  updatedData.expiryDate = formattedExpiry;

  this.collocationService.updateOffer(this.selectedOfferId, updatedData).subscribe(() => {
    this.closeUpdateModal();
    this.loadMyOffers();
  });
}
}
