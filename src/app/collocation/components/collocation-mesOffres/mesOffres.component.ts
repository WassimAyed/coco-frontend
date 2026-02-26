import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-mes-offres',
  templateUrl: './mesOffres.component.html',
  styleUrls: ['./mesOffres.component.css']
})
export class MesOffresComponent implements OnInit {

  myOffers: any[] = [];
  paginatedOffers: any[] = [];
  currentPage = 1;
  itemsPerPage = 7;                    // ✅ Now 7 items per page
  totalPages = 0;

  selectedOffer: any = {};
  selectedOfferId: number | null = null;

  showDeleteModal = false;
  showUpdateModal = false;
  isUpdating = false;

  @ViewChild('updateForm') updateForm!: NgForm;

  constructor(private collocationService: CollocationService) {}

  ngOnInit(): void {
    this.loadMyOffers();
  }

  loadMyOffers() {
    const ownerId = Number(localStorage.getItem('ownerId'));
    if (!ownerId) return;

    this.collocationService.getMyOffers(ownerId).subscribe({
      next: data => {
        this.myOffers = data || [];
        this.totalPages = Math.ceil(this.myOffers.length / this.itemsPerPage);
        this.setPage(1);
      },
      error: err => console.error(err)
    });
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedOffers = this.myOffers.slice(start, end);
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
        this.totalPages = Math.ceil(this.myOffers.length / this.itemsPerPage);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages || 1;
        this.setPage(this.currentPage);
        this.showDeleteModal = false;
      },
      error: err => console.error(err)
    });
  }

  openUpdateModal(offer: any) {
    this.selectedOffer = { ...offer };
    setTimeout(() => this.updateForm?.resetForm(this.selectedOffer));
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.isUpdating = false;
  }

  confirmUpdate() {
    if (this.updateForm.invalid) {
      Object.keys(this.updateForm.controls).forEach(field => {
        const control = this.updateForm.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    if (!this.selectedOffer?.id) return;

    this.isUpdating = true;

    this.collocationService.updateOffer(this.selectedOffer.id, this.selectedOffer)
      .subscribe({
        next: () => {
          const index = this.myOffers.findIndex(o => o.id === this.selectedOffer.id);
          if (index !== -1) {
            this.myOffers[index] = { ...this.selectedOffer };
          }
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
