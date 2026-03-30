import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventImageDto } from '../../models/event-image.model';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Translate from 'ol/interaction/Translate';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { forkJoin, map, Observable, of } from 'rxjs';
import { CategoryDto } from '../../models/category.model';
import { EventDto, UpdateEventRequest } from '../../models/event.model';
import { EventOwnershipService } from '../../services/event-ownership.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.css'
})
export class MyEventsComponent implements OnInit, OnDestroy {
  myEvents: EventDto[] = [];
  categories: CategoryDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  editFieldErrors: Record<string, string> = {};
  selectedEditCoordinates = '';
  editMainImageFile: File | null = null;
  editGalleryFiles: File[] = [];
  editExistingGallery: EventImageDto[] = [];

  editingEventId: number | null = null;
  editingEvent: EventDto | null = null;
  editModel: UpdateEventRequest = {};

  private editMap?: Map;
  private editMarkerFeature?: Feature<Point>;
  private editMarkerFeatures?: Collection<Feature<Point>>;
  private editMarkerSource?: VectorSource;
  private readonly defaultCenter: [number, number] = [36.8065, 10.1815];

  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly eventService: EventService,
    private readonly ownershipService: EventOwnershipService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadMyEvents();
  }

  ngOnDestroy(): void {
    this.editMap?.setTarget(undefined);
  }

  loadMyEvents(): void {
    const currentUserId = this.ownershipService.getCurrentUserId();
    if (!currentUserId) {
      this.errorMessage = 'You must be logged in to access your events.';
      this.myEvents = [];
      return;
    }

    const ids = new Set(this.ownershipService.getOwnedEventIds(currentUserId));
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getAll().subscribe({
      next: events => {
        this.myEvents = events.filter(item => !!item.id && ids.has(item.id));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your events.';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.eventService.getCategories().subscribe({
      next: categories => {
        this.categories = categories || [];
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  startEdit(event: EventDto): void {
    this.editingEventId = event.id || null;
    this.editingEvent = event;
    this.errorMessage = '';
    this.successMessage = '';
    this.editFieldErrors = {};
    this.editMainImageFile = null;
    this.editGalleryFiles = [];
    this.editExistingGallery = [];

    this.editModel = {
      name: event.name,
      description: event.description,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      fullAddress: event.fullAddress,
      startDate: this.toDateTimeLocal(event.startDate),
      endDate: this.toDateTimeLocal(event.endDate),
      status: event.status,
      categoryId: event.categoryId,
      maxCapacity: event.maxCapacity ?? event.capacity,
      currentParticipants: event.currentParticipants ?? event.occupiedPlaces
    };

    if (event.latitude !== undefined && event.longitude !== undefined) {
      this.selectedEditCoordinates = `${Number(event.latitude).toFixed(6)}, ${Number(event.longitude).toFixed(6)}`;
    } else {
      this.selectedEditCoordinates = '';
    }

    if (this.editingEventId) {
      this.loadEditGallery(this.editingEventId);
    }

    setTimeout(() => this.initEditMap(), 0);
  }

  cancelEdit(): void {
    this.editingEventId = null;
    this.editingEvent = null;
    this.editModel = {};
    this.editFieldErrors = {};
    this.selectedEditCoordinates = '';
    this.editMainImageFile = null;
    this.editGalleryFiles = [];
    this.editExistingGallery = [];
    this.editMap?.setTarget(undefined);
    this.editMap = undefined;
  }

  onEditMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editMainImageFile = input.files?.[0] || null;
  }

  onEditGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editGalleryFiles = Array.from(input.files || []);
  }

  removeEditGalleryFile(index: number): void {
    this.editGalleryFiles = this.editGalleryFiles.filter((_, itemIndex) => itemIndex !== index);
  }

  removeExistingGalleryImage(imageId: number): void {
    this.eventService.deleteGalleryImage(imageId).subscribe({
      next: () => {
        this.editExistingGallery = this.editExistingGallery.filter(image => image.id !== imageId);
        this.successMessage = 'Gallery image removed.';
      },
      error: () => {
        this.errorMessage = 'Unable to remove gallery image.';
      }
    });
  }

  getGalleryImage(image: EventImageDto): string {
    return image.imageUrl?.trim() || image.url?.trim() || this.fallbackCover;
  }

  saveEdit(eventId: number): void {
    const startDate = this.toDate(this.editModel.startDate);
    const endDate = this.toDate(this.editModel.endDate);

    const payload: UpdateEventRequest = {
      ...this.editModel,
      name: this.cleanString(this.editModel.name),
      description: this.cleanString(this.editModel.description),
      location: this.cleanString(this.editModel.location),
      fullAddress: this.cleanString(this.editModel.fullAddress),
      startDate: startDate ? this.formatDateForBackend(startDate) : undefined,
      endDate: endDate ? this.formatDateForBackend(endDate) : undefined,
      latitude: this.toOptionalNumber(this.editModel.latitude),
      longitude: this.toOptionalNumber(this.editModel.longitude),
      categoryId: this.toOptionalNumber(this.editModel.categoryId),
      maxCapacity: this.toOptionalNumber(this.editModel.maxCapacity),
      currentParticipants: this.toOptionalNumber(this.editModel.currentParticipants)
    };

    this.editFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.update(eventId, payload).subscribe({
      next: () => {
        this.errorMessage = '';
        this.uploadEditImages(eventId).subscribe({
          next: () => {
            this.successMessage = 'Event updated successfully.';
            this.cancelEdit();
            this.loadMyEvents();
          },
          error: () => {
            this.successMessage = 'Event updated, but some images could not be uploaded.';
            this.cancelEdit();
            this.loadMyEvents();
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error, 'Unable to update event.');
      }
    });
  }

  isEditingEvent(event: EventDto): boolean {
    return !!this.editingEventId && !!event.id && this.editingEventId === event.id;
  }

  deleteEvent(eventId: number): void {
    if (!window.confirm('Delete this event?')) {
      return;
    }

    this.eventService.delete(eventId).subscribe({
      next: () => {
        const userId = this.ownershipService.getCurrentUserId();
        if (userId) {
          this.ownershipService.removeOwnedEvent(eventId, userId);
        }
        this.successMessage = 'Event deleted successfully.';
        this.loadMyEvents();
      },
      error: () => {
        this.errorMessage = 'Unable to delete event.';
      }
    });
  }

  getEventCover(event: EventDto): string {
    return event.imageUrl?.trim() || this.fallbackCover;
  }

  getCategoryName(categoryId?: number): string {
    if (!categoryId) {
      return 'N/A';
    }

    return this.categories.find(category => category.id === categoryId)?.name || `#${categoryId}`;
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

  private initEditMap(): void {
    if (!this.editingEventId) {
      return;
    }

    const container = document.getElementById(`edit-map-${this.editingEventId}`) as HTMLDivElement | null;
    if (!container) {
      return;
    }

    this.editMap?.setTarget(undefined);

    this.editMarkerSource = new VectorSource();
    const markerLayer = new VectorLayer({ source: this.editMarkerSource });

    this.editMap = new Map({
      target: container,
      layers: [new TileLayer({ source: new OSM() }), markerLayer],
      view: new View({
        center: fromLonLat([this.defaultCenter[1], this.defaultCenter[0]]),
        zoom: 12
      })
    });

    this.editMarkerFeatures = new Collection<Feature<Point>>();
    const translate = new Translate({ features: this.editMarkerFeatures });
    translate.on('translateend', () => {
      const geometry = this.editMarkerFeature?.getGeometry();
      if (!geometry) {
        return;
      }
      const [lng, lat] = toLonLat(geometry.getCoordinates());
      this.setCoordinatesFromMap(lat, lng, false);
    });
    this.editMap.addInteraction(translate);

    this.initEditMarker();

    this.editMap.on('click', event => {
      const [lng, lat] = toLonLat(event.coordinate);
      this.setCoordinatesFromMap(lat, lng);
    });
  }

  private loadEditGallery(eventId: number): void {
    this.eventService.getGallery(eventId).subscribe({
      next: gallery => {
        this.editExistingGallery = gallery || [];
      },
      error: () => {
        this.editExistingGallery = [];
      }
    });
  }

  private initEditMarker(): void {
    const lat = this.editModel.latitude ?? this.defaultCenter[0];
    const lng = this.editModel.longitude ?? this.defaultCenter[1];

    if (!this.editMap || !this.editMarkerSource || !this.editMarkerFeatures) {
      return;
    }

    this.editMarkerFeature = new Feature({
      geometry: new Point(fromLonLat([lng, lat]))
    });
    this.editMarkerFeature.setStyle(new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: '#0f766e' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      })
    }));

    this.editMarkerSource.clear();
    this.editMarkerFeatures.clear();
    this.editMarkerSource.addFeature(this.editMarkerFeature);
    this.editMarkerFeatures.push(this.editMarkerFeature);

    this.editMap.getView().setCenter(fromLonLat([lng, lat]));
    this.editMap.getView().setZoom(12);
  }

  private setCoordinatesFromMap(latitude: number, longitude: number, moveMap = true): void {
    this.editModel.latitude = Number(latitude.toFixed(7));
    this.editModel.longitude = Number(longitude.toFixed(7));
    this.selectedEditCoordinates = `${this.editModel.latitude.toFixed(6)}, ${this.editModel.longitude.toFixed(6)}`;

    if (this.editMarkerFeature) {
      this.editMarkerFeature.setGeometry(new Point(fromLonLat([this.editModel.longitude, this.editModel.latitude])));
    }

    if (moveMap && this.editMap) {
      this.editMap.getView().animate({
        center: fromLonLat([this.editModel.longitude, this.editModel.latitude]),
        duration: 150
      });
    }
  }

  private cleanString(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private toDateTimeLocal(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
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

  private toOptionalNumber(value?: number | null): number | undefined {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
  }

  private handleApiError(error: HttpErrorResponse, fallbackMessage: string): void {
    this.editFieldErrors = this.extractFieldErrors(error);
    this.errorMessage = this.buildGlobalError(error, fallbackMessage, this.editFieldErrors);
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

  private uploadEditImages(eventId: number): Observable<void> {
    const uploads: Observable<unknown>[] = [];

    if (this.editMainImageFile) {
      uploads.push(this.eventService.uploadMainImage(eventId, this.editMainImageFile));
    }

    this.editGalleryFiles.forEach(file => {
      uploads.push(this.eventService.addGalleryImage(eventId, file));
    });

    if (uploads.length === 0) {
      return of(void 0);
    }

    return forkJoin(uploads).pipe(map(() => void 0));
  }
}
