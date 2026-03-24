import { Component, OnInit } from '@angular/core';
import { EventService } from '../../services/event.service';
import { CreateEventRequest, EventDto, EventStatus } from '../../models/event.model';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit {
  events: EventDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  selectedStatus: EventStatus | '' = '';
  categoryId: number | null = null;
  dateStart = '';
  dateEnd = '';
  nearbyLatitude: number | null = null;
  nearbyLongitude: number | null = null;
  nearbyRadiusKm = 5;

  createModel: CreateEventRequest = {
    name: '',
    description: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    startDate: '',
    endDate: '',
    status: 'PLANIFIE',
    categoryId: 2,
    maxCapacity: 1,
    currentParticipants: 0
  };

  readonly statuses: EventStatus[] = ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'];

  constructor(private readonly eventService: EventService) {}

  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  ngOnInit(): void {
    this.loadAll();
  }

  createEvent(): void {
    if (!this.createModel.name.trim()) {
      this.errorMessage = 'Le nom de l\'événement est obligatoire.';
      return;
    }

    if (!this.createModel.location.trim()) {
      this.errorMessage = 'La localisation est obligatoire.';
      return;
    }

    if (!this.createModel.startDate || !this.createModel.endDate) {
      this.errorMessage = 'La date de début et de fin sont obligatoires.';
      return;
    }

    if (!this.createModel.categoryId || this.createModel.categoryId <= 0) {
      this.errorMessage = 'Le categoryId est obligatoire.';
      return;
    }

    if (!this.createModel.maxCapacity || this.createModel.maxCapacity <= 0) {
      this.errorMessage = 'La capacité maximale doit être supérieure à 0.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: CreateEventRequest = {
      ...this.createModel,
      name: this.createModel.name.trim(),
      description: this.cleanString(this.createModel.description),
      location: this.createModel.location.trim(),
      startDate: this.cleanString(this.createModel.startDate),
      endDate: this.cleanString(this.createModel.endDate),
      latitude: this.toOptionalNumber(this.createModel.latitude),
      longitude: this.toOptionalNumber(this.createModel.longitude),
      categoryId: Number(this.createModel.categoryId),
      maxCapacity: Number(this.createModel.maxCapacity),
      currentParticipants: this.toOptionalNumber(this.createModel.currentParticipants)
    };

    this.eventService.create(payload).subscribe({
      next: () => {
        this.successMessage = 'Événement créé avec succès.';
        this.resetCreateForm();
        this.loadAll();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la création de l\'événement.';
        this.isLoading = false;
      }
    });
  }

  loadAll(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getAll().subscribe({
      next: events => {
        this.events = events;
        const firstKnownCategoryId = events.find(item => !!item.categoryId)?.categoryId;
        if (firstKnownCategoryId && (!this.createModel.categoryId || this.createModel.categoryId <= 0)) {
          this.createModel.categoryId = firstKnownCategoryId;
        }
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les événements.';
        this.isLoading = false;
      }
    });
  }

  search(): void {
    const name = this.searchTerm.trim();
    if (!name) {
      this.loadAll();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.searchByName(name).subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur pendant la recherche.';
        this.isLoading = false;
      }
    });
  }

  filterByStatus(): void {
    if (!this.selectedStatus) {
      this.loadAll();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByStatus(this.selectedStatus).subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du filtrage par statut.';
        this.isLoading = false;
      }
    });
  }

  filterByCategory(): void {
    if (!this.categoryId || this.categoryId <= 0) {
      this.errorMessage = 'Veuillez saisir un categoryId valide.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByCategory(this.categoryId).subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du filtrage par catégorie.';
        this.isLoading = false;
      }
    });
  }

  filterByDateRange(): void {
    if (!this.dateStart || !this.dateEnd) {
      this.errorMessage = 'Veuillez renseigner la date de début et de fin.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByDateRange({
      startDate: `${this.dateStart}T00:00:00`,
      endDate: `${this.dateEnd}T23:59:59`
    }).subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du filtrage par plage de dates.';
        this.isLoading = false;
      }
    });
  }

  filterNearby(): void {
    if (this.nearbyLatitude === null || this.nearbyLongitude === null) {
      this.errorMessage = 'Veuillez renseigner latitude et longitude.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getNearby({
      latitude: this.nearbyLatitude,
      longitude: this.nearbyLongitude,
      radiusKm: this.nearbyRadiusKm
    }).subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la recherche à proximité.';
        this.isLoading = false;
      }
    });
  }

  loadAvailable(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getAvailable().subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des événements disponibles.';
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.categoryId = null;
    this.dateStart = '';
    this.dateEnd = '';
    this.nearbyLatitude = null;
    this.nearbyLongitude = null;
    this.nearbyRadiusKm = 5;
    this.loadAll();
  }

  private resetCreateForm(): void {
    this.createModel = {
      name: '',
      description: '',
      location: '',
      latitude: undefined,
      longitude: undefined,
      startDate: '',
      endDate: '',
      status: 'PLANIFIE',
      categoryId: this.createModel.categoryId || 2,
      maxCapacity: 1,
      currentParticipants: 0
    };
  }

  private cleanString(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private toOptionalNumber(value?: number | null): number | undefined {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
  }

  getEventCover(event: EventDto): string {
    const fromMain = event.imageUrl?.trim();
    if (fromMain) {
      return fromMain;
    }

    const fromGallery = event.galleryUrls?.find(url => !!url?.trim())?.trim();
    return fromGallery || this.fallbackCover;
  }

  getAvailablePlaces(event: EventDto): number | 'N/A' {
    if (event.availablePlaces !== undefined && event.availablePlaces !== null) {
      return event.availablePlaces;
    }

    const max = event.maxCapacity ?? event.capacity;
    const current = event.currentParticipants ?? event.occupiedPlaces ?? 0;

    if (max === undefined || max === null) {
      return 'N/A';
    }

    return Math.max(0, max - current);
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(date);
  }

  getStatusBadgeClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'EN_COURS':
      case 'ONGOING':
        return 'status-badge status-ongoing';
      case 'TERMINE':
      case 'COMPLETED':
        return 'status-badge status-completed';
      case 'ANNULE':
      case 'CANCELLED':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge status-planned';
    }
  }

  private hydrateEventImages(events: EventDto[]): void {
    events.forEach(event => {
      if (!event.id || event.imageUrl) {
        return;
      }

      this.eventService.getGallery(event.id).subscribe({
        next: gallery => {
          const firstImage = gallery.find(img => !!img.imageUrl || !!img.url);
          if (!firstImage) {
            return;
          }

          const imageUrl = firstImage.imageUrl || firstImage.url;
          if (!imageUrl) {
            return;
          }

          this.events = this.events.map(item =>
            item.id === event.id
              ? { ...item, imageUrl, galleryUrls: [imageUrl] }
              : item
          );
        },
        error: () => {
          // le backend peut retourner 500 pour certaines galeries; on garde le fallback UI
        }
      });
    });
  }

}
