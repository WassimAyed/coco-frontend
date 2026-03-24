import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { EventImageDto } from '../../models/event-image.model';
import { EventDto, EventStatus, UpdateEventRequest } from '../../models/event.model';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent implements OnInit {
  event: EventDto | null = null;
  gallery: EventImageDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  mapUrl: SafeResourceUrl | null = null;
  mapOpenUrl: string | null = null;
  readonly fallbackCover = 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80';
  readonly statuses: EventStatus[] = ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'];

  editModel: UpdateEventRequest = {
    name: '',
    description: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    startDate: '',
    endDate: '',
    status: undefined,
    categoryId: undefined,
    maxCapacity: undefined,
    currentParticipants: undefined
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId ? Number(rawId) : NaN;

    if (Number.isNaN(id)) {
      this.errorMessage = 'Identifiant événement invalide.';
      return;
    }

    this.loadEvent(id);
    this.loadGallery(id);
  }

  private loadEvent(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getById(id).subscribe({
      next: event => {
        this.applyLoadedEvent(event);
        this.isLoading = false;
      },
      error: () => {
        this.loadEventFallbackFromList(id);
      }
    });
  }

  private loadEventFallbackFromList(id: number): void {
    this.eventService.getAll().subscribe({
      next: events => {
        const fallback = events.find(item => item.id === id);
        if (!fallback) {
          this.errorMessage = 'Impossible de charger le détail de l\'événement.';
          this.isLoading = false;
          return;
        }

        this.applyLoadedEvent(fallback);
        this.errorMessage = 'Le endpoint détail retourne 500. Affichage en mode fallback depuis la liste.';
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger le détail de l\'événement.';
        this.isLoading = false;
      }
    });
  }

  private loadGallery(id: number): void {
    this.eventService.getGallery(id).subscribe({
      next: images => {
        this.gallery = images;
        if ((!this.event?.imageUrl || !this.event.imageUrl.trim()) && images.length > 0) {
          const first = images.find(image => !!image.imageUrl || !!image.url);
          const imageUrl = first?.imageUrl || first?.url;
          if (this.event && imageUrl) {
            this.event = { ...this.event, imageUrl };
          }
        }
      },
      error: () => {
        this.gallery = [];
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  updateEvent(): void {
    if (!this.event?.id) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpdateEventRequest = {
      ...this.editModel,
      name: this.cleanString(this.editModel.name),
      description: this.cleanString(this.editModel.description),
      location: this.cleanString(this.editModel.location),
      startDate: this.cleanString(this.editModel.startDate),
      endDate: this.cleanString(this.editModel.endDate),
      latitude: this.toOptionalNumber(this.editModel.latitude),
      longitude: this.toOptionalNumber(this.editModel.longitude),
      categoryId: this.toOptionalNumber(this.editModel.categoryId),
      maxCapacity: this.toOptionalNumber(this.editModel.maxCapacity),
      currentParticipants: this.toOptionalNumber(this.editModel.currentParticipants)
    };

    this.eventService.update(this.event.id, payload).subscribe({
      next: updated => {
        this.event = updated;
        this.mapUrl = this.buildMapUrl(updated.latitude, updated.longitude);
        this.mapOpenUrl = this.buildMapOpenUrl(updated.latitude, updated.longitude);
        this.successMessage = 'Événement mis à jour.';
        this.editMode = false;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour de l\'événement.';
        this.isLoading = false;
      }
    });
  }

  deleteEvent(): void {
    if (!this.event?.id) {
      return;
    }

    const confirmed = window.confirm('Confirmer la suppression de cet événement ?');
    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.delete(this.event.id).subscribe({
      next: () => {
        this.successMessage = 'Événement supprimé.';
        this.event = null;
        this.gallery = [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression de l\'événement.';
        this.isLoading = false;
      }
    });
  }

  onMainImageSelected(eventId: number, inputEvent: Event): void {
    const input = inputEvent.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.eventService.uploadMainImage(eventId, file).subscribe({
      next: imageUrl => {
        if (this.event) {
          this.event = { ...this.event, imageUrl };
        }
        this.successMessage = 'Image principale mise à jour.';
      },
      error: () => {
        this.errorMessage = 'Erreur pendant l\'upload de l\'image principale.';
      }
    });
    input.value = '';
  }

  onGalleryImageSelected(eventId: number, inputEvent: Event): void {
    const input = inputEvent.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.eventService.addGalleryImage(eventId, file).subscribe({
      next: () => {
        this.successMessage = 'Image ajoutée à la galerie.';
        this.loadGallery(eventId);
      },
      error: () => {
        this.errorMessage = 'Erreur pendant l\'upload de l\'image de galerie.';
      }
    });
    input.value = '';
  }

  removeGalleryImage(eventId: number, imageId: number): void {
    this.eventService.deleteGalleryImage(imageId).subscribe({
      next: () => {
        this.successMessage = 'Image supprimée de la galerie.';
        this.loadGallery(eventId);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression de l\'image.';
      }
    });
  }

  private buildMapUrl(latitude?: number | null, longitude?: number | null): SafeResourceUrl | null {
    if (!this.hasValidCoordinates(latitude, longitude)) {
      return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    const delta = 0.01;
    const left = lng - delta;
    const right = lng + delta;
    const bottom = lat - delta;
    const top = lat + delta;
    const rawUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${lat},${lng}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  private buildMapOpenUrl(latitude?: number | null, longitude?: number | null): string | null {
    if (!this.hasValidCoordinates(latitude, longitude)) {
      return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  }

  private cleanString(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private toOptionalNumber(value?: number | null): number | undefined {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
  }

  private hasValidCoordinates(latitude?: number | null, longitude?: number | null): boolean {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return false;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    return Number.isFinite(lat) && Number.isFinite(lng);
  }

  private applyLoadedEvent(event: EventDto): void {
    this.event = event;
    this.editModel = {
      name: event.name,
      description: event.description,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      categoryId: event.categoryId,
      maxCapacity: event.maxCapacity ?? event.capacity,
      currentParticipants: event.currentParticipants ?? event.occupiedPlaces
    };
    this.mapUrl = this.buildMapUrl(event.latitude, event.longitude);
    this.mapOpenUrl = this.buildMapOpenUrl(event.latitude, event.longitude);
  }

  getAvailablePlaces(): number | 'N/A' {
    const event = this.event;
    if (!event) {
      return 'N/A';
    }

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

  getEventCover(): string {
    return this.event?.imageUrl?.trim() || this.fallbackCover;
  }

  getGalleryImage(image: EventImageDto): string {
    return image.imageUrl?.trim() || image.url?.trim() || this.fallbackCover;
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

}
