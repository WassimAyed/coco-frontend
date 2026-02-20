import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router , ActivatedRoute} from '@angular/router'; // for navigation

import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';

// Fix for default marker icons (Leaflet’s default assets are missing in Angular)
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

  // For favorite toggling (example: store IDs of favorited offers)
  favoriteIds: Set<number> = new Set<number>();

  private map: L.Map | undefined;
  private markers: L.Marker[] = [];

  constructor(
    private collocationService: CollocationService,
    private router: Router ,
      private route: ActivatedRoute

  ) {}

  ngOnInit(): void {
    this.loadOffers();
    // Optionally load user's favorite IDs from a service
    // this.loadFavorites();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  loadOffers(): void {
    this.loading = true;
    this.collocationService.getAllOffers().subscribe({
      next: (data) => {
        this.offers = data;
        this.filteredOffers = data;
        this.loading = false;
        this.updateMarkers();  // add markers after data loads
      },
      error: (err) => {
        this.error = 'Failed to load offers. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
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
    this.updateMarkers();  // update markers to show only filtered offers
  }

  // Action: Toggle favorite status
  toggleFavorite(offerId: number): void {
    if (this.favoriteIds.has(offerId)) {
      this.favoriteIds.delete(offerId);
      // Call service to remove from wishlist
      // this.wishlistService.remove(offerId).subscribe(...);
    } else {
      this.favoriteIds.add(offerId);
      // Call service to add to wishlist
      // this.wishlistService.add(offerId).subscribe(...);
    }
  }

  // Action: Send a request for this offer
  sendRequest(offerId: number): void {
    // Example: open a modal or navigate to a request form
    console.log('Send request for offer', offerId);
    // You might open a modal or navigate to /request/offerId
    // For now, just an alert
    alert(`Demande envoyée pour l'offre ${offerId} (simulation)`);
  }

  // Action: View offer details
 viewDetails(offerId: number): void {

  console.log('Current URL:', this.router.url);
  console.log('Offer ID:', offerId);

  this.router.navigate(['/collocation/offres', offerId]);
}

  // Center map on a clicked offer
  centerOnOffer(offer: CollocationOffer): void {
    if (offer.latitude && offer.longitude && this.map) {
      this.map.setView([offer.latitude, offer.longitude], 15);
    }
  }

  private initMap(): void {
    // Default center (Tunis)
    const defaultLat = 36.8065;
    const defaultLng = 10.1815;

    this.map = L.map('map').setView([defaultLat, defaultLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  private updateMarkers(): void {
    if (!this.map) return;

    // Remove existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Add markers for filtered offers that have coordinates
    this.filteredOffers.forEach(offer => {
      if (offer.latitude && offer.longitude) {
        const marker = L.marker([offer.latitude, offer.longitude])
          .addTo(this.map!)
          .bindPopup(this.buildPopupContent(offer));
        this.markers.push(marker);
      }
    });

    // Optionally fit the map bounds to the markers
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




}
