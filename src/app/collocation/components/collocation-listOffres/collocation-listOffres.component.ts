import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';




declare var bootstrap: any; // pour le modal

@Component({
  selector: 'app-collocation-list',
  templateUrl: './collocation-listOffres.component.html',
  styleUrls: ['./collocation-listOffres.component.css']
})
export class CollocationListComponent implements OnInit, AfterViewInit {

  offers: CollocationOffer[] = [];
  filteredOffers: CollocationOffer[] = [];
  searchTerm: string = '';
  loading = false;
  error = '';

  private map!: L.Map;
  private markers: L.Marker[] = [];

  // Filters
  filterMeublee: string = '';
  filterVille: string = '';
  filterPrixMin: number | null = null;
  filterPrixMax: number | null = null;
  filterRadius: number | null = null;
  availableVilles: string[] = [];

  // GPS
  userLat: number | null = null;
  userLng: number | null = null;

  // Favorites
  favoriteIds: number[] = [];

  // Modal request
  selectedOfferId!: number;
  requestMessage: string = '';
   currentUserId!: number;

  constructor(
    private collocationService: CollocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
     this.currentUserId = Number(localStorage.getItem('userId'));
    this.loadOffers();
    this.loadFavorites();
    this.getUserLocation();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  /* ===============================
     LOAD OFFERS
  ================================= */
  loadOffers(): void {
    this.loading = true;
    this.collocationService.getAllOffers().subscribe({
      next: (data) => {
        this.offers = data;
        this.filteredOffers = data;
        this.availableVilles = Array.from(new Set(data.map(o => o.ville))).sort();
        this.loading = false;
        this.updateMarkers();
      },
      error: (err) => {
        this.error = 'Failed to load offers.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  /* ===============================
     FILTERS
  ================================= */
  applyFilters(): void {
    this.filteredOffers = this.offers.filter(offer => {
      if (this.filterMeublee === 'true' && !offer.meublee) return false;
      if (this.filterMeublee === 'false' && offer.meublee) return false;
      if (this.filterVille && offer.ville !== this.filterVille) return false;
      if (this.filterPrixMin !== null && offer.prixLoc < this.filterPrixMin) return false;
      if (this.filterPrixMax !== null && offer.prixLoc > this.filterPrixMax) return false;
      return true;
    });
    this.updateMarkers();
  }

  filterOffers(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredOffers = !term ? this.offers : this.offers.filter(offer =>
      offer.titre.toLowerCase().includes(term) ||
      offer.description.toLowerCase().includes(term) ||
      offer.ville.toLowerCase().includes(term) ||
      offer.prixLoc.toString().includes(term)
    );
    this.updateMarkers();
  }

  applyProximityFilter(): void {
    if (!this.filterRadius) {
      this.filteredOffers = this.offers;
      this.updateMarkers();
      return;
    }
    if (!this.userLat || !this.userLng) {
      alert("Location not ready yet.");
      return;
    }
    this.loading = true;
    this.collocationService.getNearbyOffers(this.userLat, this.userLng, this.filterRadius).subscribe({
      next: (data) => {
        this.filteredOffers = data;
        this.loading = false;
        this.updateMarkers();
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      }
    });
  }

  /* ===============================
     MAP
  ================================= */
  private initMap(): void {
    const defaultLat = 36.8065;
    const defaultLng = 10.1815;
    this.map = L.map('map').setView([defaultLat, defaultLng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private updateMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.filteredOffers.forEach(offer => {
      if (offer.latitude && offer.longitude) {
        const marker = L.marker([offer.latitude, offer.longitude])
          .addTo(this.map)
          .bindPopup(this.buildPopupContent(offer));
        this.markers.push(marker);
      }
    });
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  private buildPopupContent(offer: CollocationOffer): string {
    return `<b>${offer.titre}</b><br>${offer.prixLoc} TND<br>${offer.ville}<br>${offer.chambres} chambre(s) - ${offer.meublee ? 'Meublé' : 'Non meublé'}`;
  }

  centerOnOffer(offer: CollocationOffer): void {
    if (offer.latitude && offer.longitude) this.map.setView([offer.latitude, offer.longitude], 15);
  }

  getUserLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { this.userLat = pos.coords.latitude; this.userLng = pos.coords.longitude; },
      (err) => console.error(err)
    );
  }

  /* ===============================
     FAVORITES
  ================================= */
  loadFavorites(): void {
    const userId = +localStorage.getItem("ownerId")!;
    if (!userId) return;
    this.collocationService.getFavorites(userId).subscribe({
      next: (data: any[]) => { this.favoriteIds = data.map(f => f.offre.id); },
      error: err => console.error(err)
    });
  }

  toggleFavorite(offerId: number): void {
    const userId = +localStorage.getItem("ownerId")!;
    if (!userId) return;
    if (this.favoriteIds.includes(offerId)) {
      this.collocationService.removeFavorite(userId, offerId).subscribe(() => {
        this.favoriteIds = this.favoriteIds.filter(id => id !== offerId);
      });
    } else {
      this.collocationService.addFavorite(userId, offerId).subscribe(() => {
        this.favoriteIds.push(offerId);
      });
    }
  }

  viewDetails(offerId: number): void {
    this.router.navigate(['/collocation/offres', offerId]);
  }

  createOffer(): void {
    this.router.navigate(['/collocation/create-offre']);
  }

  /* ===============================
     REQUEST MODAL
  ================================= */
  openRequestModal(offerId: number): void {
    this.selectedOfferId = offerId;
    const modalEl = document.getElementById('requestModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

submitRequest(): void {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
        this.showToast('Vous devez être connecté pour envoyer une demande.', 'danger');
        return;
    }

    if (!this.selectedOfferId) {
        this.showToast("Sélectionnez une offre avant d'envoyer la demande.", 'warning');
        return;
    }

    const payload = {
        offer: { id: this.selectedOfferId }, // juste l'ID
        message: this.requestMessage
    };

    this.collocationService.createRequest(payload, +studentId).subscribe({
        next: (res: string) => {
            console.log(res); // "Request sent"
            this.showToast('Demande envoyée avec succès !', 'success');
            this.requestMessage = '';

            const modalEl = document.getElementById('requestModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal?.hide();
            }
        },
        error: (err) => {
            console.error(err);
            this.showToast('Erreur lors de l’envoi de la demande.', 'danger');
        }
    });
}

/**
 * Crée et affiche un toast Bootstrap
 * @param message Message à afficher
 * @param type 'success' | 'danger' | 'warning' | 'info'
 */
showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') {
    // Crée le conteneur des toasts s'il n'existe pas
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.top = '1rem';
        container.style.right = '1rem';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }

    // Crée le toast
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.style.minWidth = '200px';
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(toastEl);

    // Initialise et affiche le toast
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    // Supprime le toast du DOM après disparition
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}


canSendRequest(offer: any): boolean {
  return offer.ownerId !== this.currentUserId;
}

}
