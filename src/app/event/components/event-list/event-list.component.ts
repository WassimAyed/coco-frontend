import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { forkJoin, map, Observable, of } from 'rxjs';
import { CategoryDto } from '../../models/category.model';
import { CreateEventRequest, EventDto, EventStatus } from '../../models/event.model';
import { EventOwnershipService } from '../../services/event-ownership.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('createMapContainer') createMapContainer?: ElementRef<HTMLDivElement>;

  events: EventDto[] = [];
  categories: CategoryDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  selectedStatus: EventStatus | '' = '';
  categoryFilterName = '';
  dateStart = '';
  dateEnd = '';
  nearbyLatitude: number | null = null;
  nearbyLongitude: number | null = null;
  nearbyRadiusKm = 5;
  selectedCoordinates = '';
  currentUserId: number | null = null;
  createFieldErrors: Record<string, string> = {};

  private map?: maplibregl.Map;
  private marker?: maplibregl.Marker;
  private readonly defaultCenter: [number, number] = [36.8065, 10.1815];
  mainImageFile: File | null = null;
  galleryFiles: File[] = [];

  createModel: CreateEventRequest = {
    name: '',
    description: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    fullAddress: '',
    startDate: '',
    endDate: '',
    status: 'EN_COURS',
    categoryId: 0,
    maxCapacity: 1,
    currentParticipants: 0
  };

  readonly statuses: EventStatus[] = ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'];

  constructor(
    private readonly eventService: EventService,
    private readonly ownershipService: EventOwnershipService
  ) {}

  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId')) || null;
    this.loadCategories();
    this.loadAll();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCreateMap());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  createEvent(): void {
    const name = this.cleanString(this.createModel.name) || '';
    const location = this.cleanString(this.createModel.location) || '';
    const description = this.cleanString(this.createModel.description);
    const fullAddress = this.cleanString(this.createModel.fullAddress);
    const startDate = this.toDate(this.createModel.startDate);
    const endDate = this.toDate(this.createModel.endDate);

    if (!this.currentUserId) {
      this.errorMessage = 'You must be logged in to create an event.';
      return;
    }

    this.isLoading = true;
    this.createFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';

    const payload: CreateEventRequest = {
      ...this.createModel,
      name,
      description,
      fullAddress,
      location,
      startDate: startDate ? this.formatDateForBackend(startDate) : undefined,
      endDate: endDate ? this.formatDateForBackend(endDate) : undefined,
      latitude: this.toOptionalNumber(this.createModel.latitude),
      longitude: this.toOptionalNumber(this.createModel.longitude),
      categoryId: Number(this.createModel.categoryId),
      userId: this.currentUserId,
      maxCapacity: Number(this.createModel.maxCapacity),
      currentParticipants: this.toOptionalNumber(this.createModel.currentParticipants)
    };

    this.eventService.create(payload).subscribe({
      next: created => {
        const eventId = created.id;
        if (!eventId) {
          this.successMessage = 'Event has been added successfully.';
          this.resetCreateForm();
          this.initCreateMarker();
          this.loadAll();
          return;
        }

        if (this.currentUserId) {
          this.ownershipService.addOwnedEvent(eventId, this.currentUserId);
        }

        this.uploadEventImages(eventId).subscribe({
          next: () => {
            this.successMessage = 'Event has been added successfully.';
            this.resetCreateForm();
            this.initCreateMarker();
            this.loadAll();
          },
          error: () => {
            this.successMessage = 'Event has been added successfully, but some images could not be uploaded.';
            this.resetCreateForm();
            this.initCreateMarker();
            this.loadAll();
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error, 'Error while creating event.');
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
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load events.';
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
        this.errorMessage = 'Search failed.';
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
        this.errorMessage = 'Status filtering failed.';
        this.isLoading = false;
      }
    });
  }

  filterByCategory(): void {
    const name = this.cleanString(this.categoryFilterName);
    if (!name) {
      this.errorMessage = 'Please choose a category.';
      return;
    }

    const categoryId = this.findCategoryIdByName(name);
    if (!categoryId) {
      this.errorMessage = 'Category not found.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByCategory(categoryId).subscribe({
      next: events => {
        this.events = events;
        this.hydrateEventImages(events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Category filtering failed.';
        this.isLoading = false;
      }
    });
  }

  filterByDateRange(): void {
    if (!this.dateStart || !this.dateEnd) {
      this.errorMessage = 'Please select start and end dates.';
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
        this.errorMessage = 'Date range filtering failed.';
        this.isLoading = false;
      }
    });
  }

  filterNearby(): void {
    if (this.nearbyLatitude === null || this.nearbyLongitude === null) {
      this.errorMessage = 'Please set latitude and longitude.';
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
        this.errorMessage = 'Nearby search failed.';
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
        this.errorMessage = 'Unable to load available events.';
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.categoryFilterName = '';
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
      fullAddress: '',
      startDate: '',
      endDate: '',
      status: 'EN_COURS',
      categoryId: this.categories[0]?.id || 0,
      userId: this.currentUserId || undefined,
      maxCapacity: 1,
      currentParticipants: 0
    };
    this.createFieldErrors = {};
    this.selectedCoordinates = '';
    this.mainImageFile = null;
    this.galleryFiles = [];
  }

  onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.mainImageFile = file;
  }

  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.galleryFiles = files;
  }

  removeGalleryFile(index: number): void {
    this.galleryFiles = this.galleryFiles.filter((_, fileIndex) => fileIndex !== index);
  }

  loadCategories(): void {
    this.eventService.getCategories().subscribe({
      next: categories => {
        this.categories = categories || [];
      },
      error: () => {
        this.errorMessage = 'Unable to load categories.';
      }
    });
  }

  private initCreateMap(): void {
    if (!this.createMapContainer?.nativeElement) {
      return;
    }

    const lat = this.createModel.latitude ?? this.defaultCenter[0];
    const lng = this.createModel.longitude ?? this.defaultCenter[1];

    this.map?.remove();

    this.map = new maplibregl.Map({
      container: this.createMapContainer.nativeElement,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [lng, lat],
      zoom: 12,
      attributionControl: false
    });

    this.map.on('load', () => {
      this.initCreateMarker();
      this.map?.resize();
    });

    this.map.on('click', event => {
      const { lng, lat } = event.lngLat;
      this.setCoordinatesFromMap(lat, lng);
    });
  }

  private initCreateMarker(): void {
    const lat = this.createModel.latitude ?? this.defaultCenter[0];
    const lng = this.createModel.longitude ?? this.defaultCenter[1];

    if (!this.map) {
      return;
    }

    if (!this.marker) {
      this.marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.marker.on('dragend', () => {
        const markerPosition = this.marker?.getLngLat();
        if (!markerPosition) {
          return;
        }
        this.setCoordinatesFromMap(markerPosition.lat, markerPosition.lng, false);
      });
    } else {
      this.marker.setLngLat([lng, lat]);
    }

    this.map.easeTo({ center: [lng, lat], zoom: 12, duration: 0 });

    if (this.hasMapCoordinates()) {
      this.selectedCoordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  private setCoordinatesFromMap(latitude: number, longitude: number, moveMap = true): void {
    this.createModel.latitude = Number(latitude.toFixed(7));
    this.createModel.longitude = Number(longitude.toFixed(7));
    this.selectedCoordinates = `${this.createModel.latitude.toFixed(6)}, ${this.createModel.longitude.toFixed(6)}`;

    if (this.marker) {
      this.marker.setLngLat([this.createModel.longitude, this.createModel.latitude]);
    }

    if (moveMap && this.map) {
      this.map.easeTo({
        center: [this.createModel.longitude, this.createModel.latitude],
        duration: 150
      });
    }
  }

  private hasMapCoordinates(): boolean {
    return this.createModel.latitude !== undefined && this.createModel.longitude !== undefined;
  }

  private findCategoryIdByName(name: string): number | undefined {
    return this.categories.find(category => category.name.toLowerCase() === name.toLowerCase())?.id;
  }

  private toDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.length === 16 ? `${value}:00` : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDateForBackend(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private cleanString(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private toOptionalNumber(value?: number | null): number | undefined {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
  }

  private handleApiError(error: HttpErrorResponse, fallbackMessage: string): void {
    this.createFieldErrors = this.extractFieldErrors(error);
    this.errorMessage = this.buildGlobalError(error, fallbackMessage, this.createFieldErrors);
  }

  private extractFieldErrors(error: HttpErrorResponse): Record<string, string> {
    const source = error?.error;
    if (source && typeof source === 'object' && source.fieldErrors && typeof source.fieldErrors === 'object') {
      return source.fieldErrors as Record<string, string>;
    }

    const message = source?.message;
    if (typeof message !== 'string') {
      return {};
    }

    return this.parseMapString(message);
  }

  private parseMapString(value: string): Record<string, string> {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return {};
    }

    const raw = trimmed.slice(1, -1).trim();
    if (!raw) {
      return {};
    }

    const result: Record<string, string> = {};
    const pairs = raw.split(', ');
    pairs.forEach(pair => {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex <= 0) {
        return;
      }

      const field = pair.slice(0, separatorIndex).trim();
      const message = pair.slice(separatorIndex + 1).trim();
      if (field && message) {
        result[field] = message;
      }
    });

    return result;
  }

  private buildGlobalError(error: HttpErrorResponse, fallbackMessage: string, fieldErrors: Record<string, string>): string {
    if (Object.keys(fieldErrors).length > 0) {
      return 'Please correct the highlighted fields.';
    }

    const message = error?.error?.message || error?.error?.error || error?.message;
    return typeof message === 'string' && message.trim() ? message : fallbackMessage;
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
      : new Intl.DateTimeFormat('en-US', {
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
          // Backend can return gallery errors for some events; keep UI fallback.
        }
      });
    });
  }

  private uploadEventImages(eventId: number): Observable<void> {
    const uploads: Observable<unknown>[] = [];

    if (this.mainImageFile) {
      uploads.push(this.eventService.uploadMainImage(eventId, this.mainImageFile));
    }

    this.galleryFiles.forEach(file => {
      uploads.push(this.eventService.addGalleryImage(eventId, file));
    });

    if (uploads.length === 0) {
      return of(void 0);
    }

    return forkJoin(uploads).pipe(map(() => void 0));
  }
}
