import { Component, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CollocationService } from '../../services/collocation.service';
import { UserService } from './../../../user-security/services/user.service';

@Component({
  standalone: false,
  selector: 'app-mes-favoris',
  templateUrl: './mes-favoris.component.html',
  styleUrls: ['./mes-favoris.component.css']
})
export class MesFavorisComponent implements OnInit {

  favorites: any[] = [];
  filteredFavorites: any[] = [];
  paginatedFavorites: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;
  loading = true;

  showRemoveModal = false;
  selectedFavoriteOfferId: number | null = null;

  readonly user = computed(() => this.userService.currentUser());

  constructor(
    private collocationService: CollocationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  /* ===============================
     LOAD FAVORITES
  ================================= */
  loadFavorites() {
    const currentUser = this.user();

    if (!currentUser?.id) {
      console.error('User not authenticated');
      this.loading = false;
      return;
    }

    const userId = Number(currentUser.id);

    this.collocationService.getFavorites(userId).subscribe({
      next: (data: any) => {
        // getFavorites returns objects with { offre: {...}, ... }
        this.favorites = (data || []).map((fav: any) => fav.offre || fav);
        this.filteredFavorites = [...this.favorites];
        this.updatePagination();
        this.loading = false;
      },
      error: err => {
        console.error('Error loading favorites:', err);
        this.loading = false;
      }
    });
  }

  /* ===============================
     FILTERING
  ================================= */
  filterFavorites() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredFavorites = [...this.favorites];
    } else {
      this.filteredFavorites = this.favorites.filter(o =>
        o.titre?.toLowerCase().includes(term) ||
        o.ville?.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term)
      );
    }

    this.updatePagination();
  }

  /* ===============================
     PAGINATION
  ================================= */
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredFavorites.length / this.itemsPerPage);
    this.setPage(1);
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedFavorites = this.filteredFavorites.slice(start, end);
  }

  /* ===============================
     REMOVE FAVORITE
  ================================= */
  openRemoveModal(offerId: number) {
    this.selectedFavoriteOfferId = offerId;
    this.showRemoveModal = true;
  }

  closeRemoveModal() {
    this.showRemoveModal = false;
  }

  confirmRemove() {
    if (!this.selectedFavoriteOfferId) return;

    const currentUser = this.user();
    if (!currentUser?.id) return;

    const userId = Number(currentUser.id);

    this.collocationService.removeFavorite(this.selectedFavoriteOfferId, userId).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(o => o.id !== this.selectedFavoriteOfferId);
        this.filterFavorites();
        this.showRemoveModal = false;
      },
      error: err => console.error('Error removing favorite:', err)
    });
  }

  /* ===============================
     NAVIGATION
  ================================= */
  viewDetails(id: number) {
    this.router.navigate(['/collocation/offres', id]);
  }
}
