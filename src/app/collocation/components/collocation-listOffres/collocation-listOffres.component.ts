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
import { VoiceSearchService } from '../../services/voice-search.service';
import { SmartCollocationService } from '../../services/smart-collocation.service';

import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import { catchError, filter, forkJoin, of, Subject, switchMap, tap, map } from 'rxjs';

declare var bootstrap: any;

@Component({
  standalone: false,
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
  isListening = false;

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
     MODAL & TOASTS
  ================================= */
  @ViewChild('requestModalRef') modalRef!: ElementRef;
  showRequestModal = false;
  selectedOfferId!: number;
  requestMessage = '';

  toastMessage = '';
  showToastVisible = false;

  /* ===============================
     USER & AI MATCHING
  ================================= */
  private readonly userService = inject(UserService);
  private readonly matchingService = inject(MatchingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly voiceSearchService = inject(VoiceSearchService);
  private readonly smartCollocationService = inject(SmartCollocationService);

  readonly user = computed(() => this.userService.currentUser());
  currentUserId!: number;
  currentUserProfile: any = null; // Stored user profile

  recommendedOffers: CollocationOffer[] = [];

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
        if (!enabled) {
          this.matchingEnabled = false;
          console.log(`[AI Match] Toggled off`);
          this.clearScores();
        }
      }),
      filter(enabled => enabled === true),
      switchMap(() => {
        // Safe check without breaking the RxJS stream
        if (!this.isUserProfileComplete()) {
          this.matchingEnabled = false;
          this.isMatchingLoading = false;
          this.showToast('Veuillez compléter votre profil (âge, budget, ville...) pour utiliser le Match IA.');
          return of(null); // Return null to gracefully skip this execution
        }

        this.matchingEnabled = true;
        this.isMatchingLoading = true;
        console.log(`[AI Match] Toggled on`);

        return this.executeMatchingPipeline().pipe(
          catchError(err => {
            console.error('[AI Match] Matching pipeline failed:', err);
            this.isMatchingLoading = false;
            this.showToast('Erreur lors du calcul IA. Veuillez réessayer plus tard.');
            return of(null);
          })
        );
      })
    ).subscribe(scores => {
      if (scores !== null) {
        console.log('[AI Match] Raw scores received from service:', scores);
        this.applyScoresAndSort(scores);
        this.isMatchingLoading = false;
      }
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

    // Fetch user profile on initialization so it's ready for validation
    this.userService.getProfileByUserId(this.currentUserId).subscribe({
      next: (profile) => {
        this.currentUserProfile = profile;
      },
      error: (err) => console.warn('Could not load user profile', err)
    });

    this.loadOffers();
    this.loadFavorites();
    this.getUserLocation();
    
    setTimeout(() => {
      if (this.currentUserId) {
        this.loadRecommendations();
      }
    }, 1000); // load after offers

    // Voice Search Subscriptions
    this.voiceSearchService.setLanguage('fr-FR');

    this.voiceSearchService.isListening$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isListening => {
      this.isListening = isListening;
    });

    this.voiceSearchService.text$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(text => {
      this.searchTerm = text;
      this.filterOffers();
    });

    this.voiceSearchService.error$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(errorCode => {
      if (errorCode === 'not_supported') {
        this.showToast('Recherche vocale non supportée par votre navigateur.');
      } else if (errorCode === 'not-allowed') {
        this.showToast('Accès au microphone refusé. Vérifiez vos permissions.');
      } else {
        this.showToast(`Erreur micro: ${errorCode}`);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    if (this.userLat && this.userLng) {
      this.addUserMarker();
    }
  }

  /* ===============================
     TOAST UTILITY
  ================================= */
  showToast(message: string) {
    this.toastMessage = message;
    this.showToastVisible = true;
    setTimeout(() => {
      this.showToastVisible = false;
    }, 4000); // Hides after 4 seconds
  }

  /* ===============================
     AI MATCHING LOGIC
  ================================= */
  toggleMatchingAI() {
    this.matchToggle$.next(!this.matchingEnabled);
  }

  isUserProfileComplete(): boolean {
    const p = this.currentUserProfile;
    if (!p) return false;

    // Check required fields for the AI Matching Python API
    return (
      (p.age != null && p.age > 0) &&
      (p.budget != null && p.budget > 0) &&
      (p.cleanliness !== undefined && p.cleanliness !== null) &&
      (p.pets !== undefined && p.pets !== null) &&
      (p.city && p.city.trim() !== '') &&
      (p.gender && p.gender.trim() !== '') &&
      (p.latitude != null) &&
      (p.longitude != null)
    );
  }

  private mapToProfileRequest(profile: any, userId: number): any {
    return {
      userId: userId.toString(),
      age: profile.age,
      gender: profile.gender,
      budget: profile.budget,
      city: profile.city,
      smoker: profile.smoker ?? false,
      pets: profile.pets ?? false,
      cleanliness: profile.cleanliness ?? 5,
      sleepSchedule: profile.sleepSchedule || 'flexible',
      studyLevel: profile.studyLevel || 'other',
      socialLevel: profile.socialLevel ?? 5,
      acceptsGuests: profile.acceptsGuests ?? true,
      noiseTolerance: profile.noiseTolerance ?? 5,
      latitude: profile.latitude,
      longitude: profile.longitude
    };
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
          map(profilesWithIds => {
            // Each profileRequest returns the profile object. We need to pair it with its ID.
            return profilesWithIds
              .map((p, index) => p ? this.mapToProfileRequest(p, uniqueIds[index]) : null)
              .filter(p => p !== null);
          }),
          switchMap(publisherProfiles => {
            if (publisherProfiles.length === 0) return of([]);
            console.log(`[AI Match] Sending ${publisherProfiles.length} candidate profiles to AI...`);

            const mappedCurrentUser = this.mapToProfileRequest(this.currentUserProfile, Number(currentUserId));

            return this.matchingService.match(mappedCurrentUser, publisherProfiles).pipe(
              map((rawScores: any[]) => {
                return rawScores.map((result, index) => {
                  const correctId = uniqueIds[index];
                  // Use totalScore from the updated backend, fallback to score if old API
                  const percentageScore = Math.round((result.totalScore || result.score || 0) * 100);

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

    const userBudget = this.currentUserProfile?.budget || 0;

    this.filteredOffers = this.filteredOffers.map(offre => {
      let mappedScore = scoreMap.get(Number(offre.ownerId));

      let finalMatchScore = undefined;
      let calculatedBudgetScore = 0;

      if (mappedScore !== undefined) {
        // We received existing_score from Python API as percentage (0-100)
        // Let's calculate the Budget compatibility on the Frontend to be able to access the Offer details
        const offerPrice = offre.prixLoc || 0;

        if (userBudget !== 0) {
          const difference = Math.abs(userBudget - offerPrice);
          const normalizedBudgetScore = Math.max(0, 1 - (difference / userBudget));
          calculatedBudgetScore = normalizedBudgetScore * 100; // Convert to percentage
        }

        // Apply 80% User matching (MappedScore) and 20% Budget matching
        finalMatchScore = Math.round((mappedScore * 0.8) + (calculatedBudgetScore * 0.2));
      }

      return {
        ...offre,
        matchScore: finalMatchScore
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
    this.applyFilters();
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

  loadRecommendations(): void {
    if (!this.currentUserId) return;
    this.smartCollocationService.getRecommendations(this.currentUserId).subscribe({
      next: (ids) => {
        this.recommendedOffers = this.offers.filter(o => ids.includes(o.id));
      },
      error: err => console.error("Could not load recommendations", err)
    });
  }

  toggleVoiceSearch(): void {
    if (this.isListening) {
      this.voiceSearchService.stopListening();
    } else {
      this.voiceSearchService.startListening();
    }
  }

  /* ===============================
     MAP
  ================================= */
  private initMap(): void {
    this.map = L.map('map', {
      scrollWheelZoom: true,
      attributionControl: true
    }).setView([36.8065, 10.1815], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // CRITICAL: Force map to recalculate its container size
    // This fixes the "partial blocks" or "grey map" issue.
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        console.log('[Map] invalidateSize called');
      }
    }, 500);
  }

  private updateMarkers(): void {
    if (!this.map) return;

    // Also invalidate size here in case layout shifted
    this.map.invalidateSize();

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