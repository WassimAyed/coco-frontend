import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  computed,
  ViewChild,
  ElementRef,
  DestroyRef
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import { UserService } from './../../../user-security/services/user.service';
import { MatchingService } from '../../../user-security/services/matchingColloc.service';

import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import { catchError, filter, forkJoin, of, Subject, switchMap, tap, map } from 'rxjs';

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
  private userMarker!: L.Marker;

  private userIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  });

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
  showRequestModal = false;
  selectedOfferId!: number;
  requestMessage = '';

  /* ===============================
     USER & AI MATCHING
  ================================= */
  private readonly userService = inject(UserService);
  private readonly matchingService = inject(MatchingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = computed(() => this.userService.currentUser());
  currentUserId!: number;

  matchingEnabled = false;
  isMatchingLoading = false;
  private matchToggle$ = new Subject<boolean>();

  constructor(
    private collocationService: CollocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Core AI Pipeline
    this.matchToggle$.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(enabled => {
        this.matchingEnabled = enabled;
        console.log(`[AI Match] Toggled to: ${enabled}`);
        if (!enabled) this.clearScores();
      }),
      filter(enabled => enabled === true),
      tap(() => this.isMatchingLoading = true),
      switchMap(() => this.executeMatchingPipeline()),
      catchError(err => {
        console.error('[AI Match] Matching pipeline failed:', err);
        this.isMatchingLoading = false;
        return of([]);
      })
    ).subscribe(scores => {
      console.log('[AI Match] Raw scores received from service:', scores);
      this.applyScoresAndSort(scores);
      this.isMatchingLoading = false;
    });
  }

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
    if (this.userLat && this.userLng) {
      this.addUserMarker();
    }
  }

  /* ===============================
     AI MATCHING LOGIC
  ================================= */
  toggleMatchingAI() {
    this.matchToggle$.next(!this.matchingEnabled);
  }

 private executeMatchingPipeline() {
    const currentUserId = this.userService.currentUser()?.id;
    const currentOffers = this.filteredOffers;

    if (!currentUserId || !currentOffers.length) {
      console.warn('[AI Match] No user ID or no offers to match against.');
      return of([]);
    }

    return this.userService.getProfileByUserId(Number(currentUserId)).pipe(
      switchMap(currentUserProfile => {
        if (!currentUserProfile) {
           console.warn('[AI Match] Current user profile not found.');
           return of([]);
        }

        const publisherIds = currentOffers
          .map(o => o.ownerId)
          .filter(id => id !== Number(currentUserId) && id != null);

        const uniqueIds = [...new Set(publisherIds)];
        if (uniqueIds.length === 0) {
            console.log('[AI Match] No other publishers to match with.');
            return of([]);
        }

        const profileRequests = uniqueIds.map(id =>
          this.userService.getProfileByUserId(Number(id)).pipe(
            catchError(err => {
              console.warn(`[AI Match] Profile ${id} failed to load, skipping.`, err);
              return of(null);
            })
          )
        );

        return forkJoin(profileRequests).pipe(
          map(profiles => profiles.filter(p => p !== null)),
          switchMap(publisherProfiles => {
            if (publisherProfiles.length === 0) return of([]);
            console.log(`[AI Match] Sending ${publisherProfiles.length} profiles to AI...`);

            // Call the AI and map the results to fix the missing ID and decimal score
            return this.matchingService.match(currentUserProfile, publisherProfiles).pipe(
              map((rawScores: any[]) => {
                return rawScores.map((result, index) => {
                  // Re-attach the ID from our uniqueIds array since the AI lost it
                  const correctId = uniqueIds[index];

                  // Convert 0.4088... to 41
                  const percentageScore = Math.round((result.score || 0) * 100);

                  return {
                    candidateUserId: Number(correctId),
                    score: percentageScore
                  };
                });
              })
            );
          })
        );
      })
    );
  }

  private applyScoresAndSort(scores: any[]) {
    if (!scores || scores.length === 0) {
        console.warn('[AI Match] No scores to apply.');
        return;
    }

    const scoreMap = new Map<number, number>(
      scores.map(s => [s.candidateUserId, s.score])
    );

    this.filteredOffers = this.filteredOffers.map(offre => {
      const mappedScore = scoreMap.get(Number(offre.ownerId));
      return {
        ...offre,
        matchScore: mappedScore !== undefined ? mappedScore : undefined
      };
    }).sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

    console.log('[AI Match] Offers successfully sorted with scores:', this.filteredOffers);
    this.updateMarkers();
  }

  private clearScores() {
    this.filteredOffers = this.filteredOffers.map(offre => ({
      ...offre,
      matchScore: undefined
    }));
    this.applyFilters(); // Re-sorts back to default without scores
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

    if (this.matchingEnabled) {
        this.filteredOffers.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    }

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

    if (this.matchingEnabled) {
        this.filteredOffers.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    }

    this.updateMarkers();
  }

  /* ===============================
     MAP
  ================================= */
  private initMap(): void {
    this.map = L.map('map').setView([36.8065, 10.1815], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
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

      if (this.map) {
        this.addUserMarker();
      }
    }, err => {
      console.error('Geolocation error:', err);
    });
  }

  private addUserMarker(): void {
    if (!this.userLat || !this.userLng) return;

    if (this.userMarker) {
      this.userMarker.remove();
    }

    this.userMarker = L.marker([this.userLat, this.userLng], {
      icon: this.userIcon
    })
      .addTo(this.map)
      .bindPopup('<b>📍 You are here</b>')
      .openPopup();

    L.circle([this.userLat, this.userLng], {
      radius: (this.filterRadius || 5) * 1000,
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.1
    }).addTo(this.map);

    this.map.setView([this.userLat, this.userLng], 13);
  }

  applyProximityFilter(): void {
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

    if (this.matchingEnabled) {
        this.filteredOffers.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    }

    this.updateMarkers();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
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

  /* ===============================
     FAVORITES & NAVIGATION & MODAL
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

  viewDetails(id: number) {
    this.router.navigate(['/collocation/offres', id]);
  }

  createOffer() {
    this.router.navigate(['/collocation/create-offre']);
  }

  openRequestModal(offerId: number): void {
    this.selectedOfferId = offerId;
    this.showRequestModal = true;
  }

  onRequestSubmitted(): void {
    this.showRequestModal = false;
  }

  canSendRequest(offer: CollocationOffer): boolean {
    return offer.ownerId !== this.currentUserId;
  }
}
