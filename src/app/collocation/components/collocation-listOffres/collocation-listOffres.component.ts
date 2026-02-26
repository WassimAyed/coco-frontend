import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';

/* ===============================
   Fix Leaflet default marker icons
================================ */
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = iconDefault;

/* ===============================
   COMPONENT
================================ */
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

  constructor(
    private collocationService: CollocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* ===============================
     LIFECYCLE
  ================================= */
  ngOnInit(): void {
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

        this.availableVilles = Array.from(
          new Set(data.map(o => o.ville))
        ).sort();

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
     CLASSIC FILTERS
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

    if (!term) {
      this.filteredOffers = this.offers;
    } else {
      this.filteredOffers = this.offers.filter(offer =>
        offer.titre.toLowerCase().includes(term) ||
        offer.description.toLowerCase().includes(term) ||
        offer.ville.toLowerCase().includes(term) ||
        offer.prixLoc.toString().includes(term)
      );
    }

    this.updateMarkers();
  }

  /* ===============================
     PROXIMITY FILTER
  ================================= */
  applyProximityFilter(): void {

    // Reset if radius cleared
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

    this.collocationService.getNearbyOffers(
      this.userLat,
      this.userLng,
      this.filterRadius
    ).subscribe({
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
    if (!this.map) return;

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
    return `
      <b>${offer.titre}</b><br>
      ${offer.prixLoc} TND<br>
      ${offer.ville}<br>
      ${offer.chambres} chambre(s) - ${offer.meublee ? 'Meublé' : 'Non meublé'}
    `;
  }

  centerOnOffer(offer: CollocationOffer): void {
    if (offer.latitude && offer.longitude) {
      this.map.setView([offer.latitude, offer.longitude], 15);
    }
  }

  /* ===============================
     GPS
  ================================= */
  getUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLat = position.coords.latitude;
        this.userLng = position.coords.longitude;
        console.log("User location:", this.userLat, this.userLng);
      },
      (error) => {
        console.error("Location error:", error);
      }
    );
  }

  /* ===============================
     FAVORITES
  ================================= */
  loadFavorites(): void {
    const userId = +localStorage.getItem("ownerId")!;
    if (!userId) return;

    this.collocationService.getFavorites(userId).subscribe({
      next: (data: any[]) => {
        this.favoriteIds = data.map(f => f.offre.id);
      },
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

  /* ===============================
     NAVIGATION
  ================================= */
  viewDetails(offerId: number): void {
    this.router.navigate(['/collocation/offres', offerId]);
  }

  createOffer(): void {
    this.router.navigate(['/collocation/create-offre']);
  }

  sendRequest(offerId: number): void {
    alert(`Demande envoyée pour l'offre ${offerId} (simulation)`);
  }
}
