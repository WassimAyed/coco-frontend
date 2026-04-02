import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  computed,
  ViewChild,
  ElementRef
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import { UserService } from './../../../user-security/services/user.service';

import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';

declare var bootstrap: any;

@Component({
  selector: 'app-collocation-list',
  templateUrl: './collocation-listOffres.component.html',
  styleUrls: ['./collocation-listOffres.component.css']
})
export class CollocationListComponent implements OnInit, AfterViewInit {

  /* ===============================
     DATA
  ================================= */
  offers: CollocationOffer[] = [];
  filteredOffers: CollocationOffer[] = [];

  searchTerm = '';
  loading = false;
  error = '';

  /* ===============================
     MAP
  ================================= */
  private map!: L.Map;
  private markers: L.Marker[] = [];

  /* ===============================
     FILTERS
  ================================= */
  filterMeublee = '';
  filterVille = '';
  filterPrixMin: number | null = null;
  filterPrixMax: number | null = null;
  filterRadius: number | null = null;
  availableVilles: string[] = [];

  /* ===============================
     GPS
  ================================= */
  userLat: number | null = null;
  userLng: number | null = null;

  /* ===============================
     FAVORITES
  ================================= */
  favoriteIds: number[] = [];

  /* ===============================
     MODAL
  ================================= */
  @ViewChild('requestModalRef') modalRef!: ElementRef;
  private modalInstance: any;

  selectedOfferId!: number;
  requestMessage = '';

  /* ===============================
     USER
  ================================= */
  private readonly userService = inject(UserService);
  readonly user = computed(() => this.userService.currentUser());

  currentUserId!: number;

  constructor(
    private collocationService: CollocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* ===============================
     INIT
  ================================= */
  ngOnInit(): void {
    const currentUser = this.user();

    if (!currentUser?.id) {
      this.error = 'User not authenticated';
      return;
    }

    this.currentUserId = Number(currentUser.id);

    this.loadOffers();
    this.loadFavorites();
    this.getUserLocation();
  }

  ngAfterViewInit(): void {
    this.initMap();


  }

  /* ===============================
     OFFERS
  ================================= */
  loadOffers(): void {
    this.loading = true;

    this.collocationService.getAllOffers().subscribe({
      next: data => {
        this.offers = data;
        this.filteredOffers = data;
        this.availableVilles = Array.from(
          new Set(data.map(o => o.ville))
        ).sort();

        this.loading = false;
        this.updateMarkers();
      },
      error: err => {
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
    this.filteredOffers = this.offers.filter(o => {
      if (this.filterMeublee === 'true' && !o.meublee) return false;
      if (this.filterMeublee === 'false' && o.meublee) return false;
      if (this.filterVille && o.ville !== this.filterVille) return false;
      if (this.filterPrixMin !== null && o.prixLoc < this.filterPrixMin) return false;
      if (this.filterPrixMax !== null && o.prixLoc > this.filterPrixMax) return false;
      return true;
    });

    this.updateMarkers();
  }

  filterOffers(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredOffers = !term
      ? this.offers
      : this.offers.filter(o =>
          o.titre.toLowerCase().includes(term) ||
          o.description.toLowerCase().includes(term) ||
          o.ville.toLowerCase().includes(term)
        );

    this.updateMarkers();
  }

  /* ===============================
     MAP
  ================================= */
  private initMap(): void {
    this.map = L.map('map').setView([36.8065, 10.1815], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(this.map);
  }

  private updateMarkers(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    this.filteredOffers.forEach(o => {
      if (o.latitude && o.longitude) {
        const marker = L.marker([o.latitude, o.longitude])
          .addTo(this.map)
          .bindPopup(`<b>${o.titre}</b><br>${o.prixLoc} TND`);

        this.markers.push(marker);
      }
    });
  }

  centerOnOffer(o: CollocationOffer) {
    if (o.latitude && o.longitude)
      this.map.setView([o.latitude, o.longitude], 15);
  }

  /* ===============================
     GEOLOCATION
  ================================= */
  getUserLocation(): void {
    navigator.geolocation.getCurrentPosition(pos => {
      this.userLat = pos.coords.latitude;
      this.userLng = pos.coords.longitude;
    });
  }

  /* ===============================
     FAVORITES
  ================================= */
  loadFavorites(): void {
    const user = this.user();
    if (!user?.id) return;

    this.collocationService
      .getFavorites(Number(user.id))
      .subscribe(data => {
        this.favoriteIds = data.map((f: any) => f.offre.id);
      });
  }

toggleFavorite(offerId: number): void {
  const userId = Number(this.user()?.id);

  if (this.favoriteIds.includes(offerId)) {
    this.favoriteIds = this.favoriteIds.filter(id => id !== offerId);
    this.collocationService.removeFavorite(userId, offerId).subscribe();
  } else {
    this.favoriteIds.push(offerId);
    this.collocationService.addFavorite(userId, offerId).subscribe();
  }
}

  /* ===============================
     NAVIGATION
  ================================= */
  viewDetails(id: number) {
    this.router.navigate(['/collocation/offres', id]);
  }

  createOffer() {
    this.router.navigate(['/collocation/create-offre']);
  }

  /* ===============================
     MODAL
  ================================= */


showRequestModal = false;

openRequestModal(offerId: number): void {
  this.selectedOfferId = offerId;
  this.showRequestModal = true;
}

onRequestSubmitted(): void {
  this.showRequestModal = false;
  // optionally show a success toast here
}

  canSendRequest(offer: CollocationOffer): boolean {
    return offer.ownerId !== this.currentUserId;
  }



  applyProximityFilter(): void {

  // If no radius or no GPS → show all
  if (!this.filterRadius || !this.userLat || !this.userLng) {
    this.filteredOffers = [...this.offers];
    this.updateMarkers();
    return;
  }

  const radiusKm = Number(this.filterRadius);

  this.filteredOffers = this.offers.filter(offer => {

    if (!offer.latitude || !offer.longitude) return false;

    const distance = this.calculateDistance(
      this.userLat!,
      this.userLng!,
      offer.latitude,
      offer.longitude
    );

    return distance <= radiusKm;
  });

  this.updateMarkers();
}


private calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const R = 6371; // Earth radius in KM

  const dLat = this.toRad(lat2 - lat1);
  const dLon = this.toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) *
    Math.cos(this.toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
private toRad(value: number): number {
  return value * Math.PI / 180;
}





}
