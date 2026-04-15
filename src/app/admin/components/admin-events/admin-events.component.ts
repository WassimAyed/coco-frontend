import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Component, OnDestroy, OnInit } from '@angular/core';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoryDto } from '../../../event/models/category.model';
import { CommentDto } from '../../../event/models/comment.model';
import { EventImageDto } from '../../../event/models/event-image.model';
import { CreateEventRequest, EventDto, EventStatus, ExternalPredictionRequest, UpdateEventRequest } from '../../../event/models/event.model';
import { ParticipantDto } from '../../../event/models/participant.model';
import { REACTION_EMOJI, ReactionType } from '../../../event/models/reaction.model';
import { CommentService } from '../../../event/services/comment.service';
import { EventService } from '../../../event/services/event.service';
import { ParticipantService } from '../../../event/services/participant.service';
import { ReactionService } from '../../../event/services/reaction.service';

interface StatsDTO {
  totalEvents: number;
  totalParticipants: number;
  totalCategories: number;
  availableEvents: number;
  eventsByStatus: Record<string, number>;
  eventsByCategory: Record<string, number>;
  participantsByEvent: Record<string, number>;
}

interface EventCreatorInfo {
  name: string;
  email: string;
}

interface CategoryFormModel {
  name: string;
  description: string;
}

interface CreatorRow {
  userId: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-admin-events',
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css'
})
export class AdminEventsComponent implements OnInit, OnDestroy {
  events: EventDto[] = [];
  categories: CategoryDto[] = [];
  creatorByUserId: Record<number, EventCreatorInfo> = {};
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  createFieldErrors: Record<string, string> = {};
  selectedCreateCoordinates = '';
  mainImageFile: File | null = null;
  galleryFiles: File[] = [];
  createWeatherPreview: {
    temperature?: number;
    precipitationMm?: number;
    windSpeedKmh?: number;
    weatherLabel?: string;
  } | null = null;
  isCreateWeatherLoading = false;

  editFieldErrors: Record<string, string> = {};
  selectedEditCoordinates = '';
  editExistingMainImageUrl = '';
  editMainImageFile: File | null = null;
  editGalleryFiles: File[] = [];
  editExistingGallery: EventImageDto[] = [];

  isCreateModalOpen = false;
  isSavingCreate = false;
  createEventModel: CreateEventRequest = this.buildDefaultCreateModel();
  createPredictionRequest: ExternalPredictionRequest | null = null;
  lastSavedEvent: EventDto | null = null;

  editingEventId: number | null = null;
  editingEvent: EventDto | null = null;
  editEventModel: UpdateEventRequest = {};
  isSavingEdit = false;
  weatherPreview: {
    temperature?: number;
    precipitationMm?: number;
    windSpeedKmh?: number;
    weatherLabel?: string;
  } | null = null;

  newCategoryModel: CategoryFormModel = { name: '', description: '' };
  isSavingCategory = false;
  isCategoryCreateModalOpen = false;
  editingCategoryId: number | null = null;
  editCategoryModel: CategoryFormModel = { name: '', description: '' };

  detailModalEvent: EventDto | null = null;
  isDetailModalLoading = false;
  detailModalReactions: Partial<Record<ReactionType, number>> = {};
  detailModalComments: CommentDto[] = [];
  detailModalParticipants: ParticipantDto[] = [];
  stats: StatsDTO | null = null;
  searchName = '';
  selectedStatus: EventStatus | '' = '';
  selectedCategory: number | '' = '';
  dateFrom = '';
  dateTo = '';
  currentPage = 0;
  totalPages = 0;
  pageSize = 9;

  readonly reactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
  readonly reactionEmoji = REACTION_EMOJI;
  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
  dateTimeMin = this.buildDateTimeLocalValue(new Date());

  mapOpenUrl: string | null = null;
  private detailMap?: maplibregl.Map;
  private detailMarker?: maplibregl.Marker;
  private createMap?: maplibregl.Map;
  private createMarker?: maplibregl.Marker;
  private editMap?: maplibregl.Map;
  private editMarker?: maplibregl.Marker;
  private readonly defaultCenter: [number, number] = [36.8065, 10.1815];

  constructor(
    private readonly eventService: EventService,
    private readonly reactionService: ReactionService,
    private readonly commentService: CommentService,
    private readonly participantService: ParticipantService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadEvents();
    this.loadStats();
    this.autoDismissMessages();
  }

  ngOnDestroy(): void {
    this.createMap?.remove();
    this.editMap?.remove();
    this.detailMap?.remove();
  }

  loadEvents(): void {
    const filter = this.resolveFilterType();
    if (filter === 'search') {
      this.loadByName();
      return;
    }
    if (filter === 'status') {
      this.loadByStatus();
      return;
    }
    if (filter === 'category') {
      this.loadByCategory();
      return;
    }
    if (filter === 'date-range') {
      this.loadByDateRange();
      return;
    }

    this.loadAll();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadEvents();
  }

  resetFilters(): void {
    this.searchName = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage = 0;
    this.loadAll();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEvents();
  }

  private loadAll(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getAllPaged({ page: this.currentPage, size: this.pageSize }).subscribe({
      next: response => {
        this.events = response?.content || [];
        this.currentPage = response?.page || 0;
        this.totalPages = response?.totalPages || 0;
        this.loadCreators(this.events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load events.';
        this.isLoading = false;
      }
    });
  }

  private loadByName(): void {
    const name = this.searchName.trim();
    if (!name) {
      this.loadAll();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.searchByNamePaged(name, { page: this.currentPage, size: this.pageSize }).subscribe({
      next: response => {
        this.events = response?.content || [];
        this.currentPage = response?.page || 0;
        this.totalPages = response?.totalPages || 0;
        this.loadCreators(this.events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to filter by name.';
        this.isLoading = false;
      }
    });
  }

  private loadByStatus(): void {
    if (!this.selectedStatus) {
      this.loadAll();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByStatusPaged(this.selectedStatus, { page: this.currentPage, size: this.pageSize }).subscribe({
      next: response => {
        this.events = response?.content || [];
        this.currentPage = response?.page || 0;
        this.totalPages = response?.totalPages || 0;
        this.loadCreators(this.events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to filter by status.';
        this.isLoading = false;
      }
    });
  }

  private loadByCategory(): void {
    if (!this.selectedCategory) {
      this.loadAll();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByCategoryPaged(Number(this.selectedCategory), {
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: response => {
        this.events = response?.content || [];
        this.currentPage = response?.page || 0;
        this.totalPages = response?.totalPages || 0;
        this.loadCreators(this.events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to filter by category.';
        this.isLoading = false;
      }
    });
  }

  private loadByDateRange(): void {
    if (!this.dateFrom || !this.dateTo) {
      this.loadAll();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getByDateRangePaged({
      startDate: this.dateFrom,
      endDate: this.dateTo,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: response => {
        this.events = response?.content || [];
        this.currentPage = response?.page || 0;
        this.totalPages = response?.totalPages || 0;
        this.loadCreators(this.events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to filter by date range.';
        this.isLoading = false;
      }
    });
  }

  private resolveFilterType(): 'all' | 'search' | 'status' | 'category' | 'date-range' {
    if (this.searchName.trim()) {
      return 'search';
    }
    if (this.selectedStatus) {
      return 'status';
    }
    if (this.selectedCategory) {
      return 'category';
    }
    if (this.dateFrom && this.dateTo) {
      return 'date-range';
    }
    return 'all';
  }

  deleteEvent(eventId: number): void {
    if (!window.confirm('Delete this event?')) {
      return;
    }

    this.eventService.delete(eventId).subscribe({
      next: () => {
        this.successMessage = 'Event deleted successfully.';
        this.loadEvents();
      },
      error: () => {
        this.errorMessage = 'Unable to delete event.';
      }
    });
  }

  acceptEvent(eventId: number): void {
    this.eventService.updateStatus(eventId, 'ACCEPTED').subscribe({
      next: () => {
        this.successMessage = 'Event accepted successfully.';
        this.loadEvents();
      },
      error: () => this.errorMessage = 'Unable to accept event.'
    });
  }

  refuseEvent(eventId: number): void {
    this.eventService.updateStatus(eventId, 'REFUSED').subscribe({
      next: () => {
        this.successMessage = 'Event refused successfully.';
        this.loadEvents();
      },
      error: () => this.errorMessage = 'Unable to refuse event.'
    });
  }

  openCreateModal(): void {
    this.cancelEdit();
    this.errorMessage = '';
    this.successMessage = '';
    this.isCreateModalOpen = true;
    this.refreshDateTimeConstraints();
    this.resetCreateForm();
    this.createEventModel.categoryId = this.categories[0]?.id || 0;
    setTimeout(() => this.initCreateMap(), 0);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.isSavingCreate = false;
    this.createWeatherPreview = null;
    this.isCreateWeatherLoading = false;
    this.resetCreateForm();
    this.createMap?.remove();
    this.createMap = undefined;
    this.createMarker = undefined;
  }

  createEvent(): void {
    if (this.isSavingCreate) {
      return;
    }

    const name = this.cleanString(this.createEventModel.name) || '';
    const location = this.cleanString(this.createEventModel.location) || '';
    const description = this.cleanString(this.createEventModel.description);
    const price = this.toOptionalNumber(this.createEventModel.price);
    const startDate = this.toDate(this.createEventModel.startDate);
    const endDate = this.toDate(this.createEventModel.endDate);

    this.isSavingCreate = true;
    this.createFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';

    const payload: CreateEventRequest = {
      ...this.createEventModel,
      name,
      description,
      location,
      startDate: startDate ? this.formatDateForBackend(startDate) : undefined,
      endDate: endDate ? this.formatDateForBackend(endDate) : undefined,
      latitude: this.toOptionalNumber(this.createEventModel.latitude),
      longitude: this.toOptionalNumber(this.createEventModel.longitude),
      categoryId: Number(this.createEventModel.categoryId),
      userId: this.getCurrentUserId(),
      maxCapacity: Number(this.createEventModel.maxCapacity),
      currentParticipants: this.toOptionalNumber(this.createEventModel.currentParticipants),
      price
    };

    this.createPredictionRequest = this.buildExternalPredictionRequest(payload, startDate, endDate);

    this.eventService.create(payload).subscribe({
      next: created => {
        this.lastSavedEvent = created;
        const eventId = created.id;
        if (!eventId) {
          this.isSavingCreate = false;
          this.successMessage = 'Event has been added successfully.';
          this.closeCreateModal();
          this.loadEvents();
          return;
        }

        this.uploadCreateImages(eventId).subscribe({
          next: () => {
            this.isSavingCreate = false;
            this.successMessage = 'Event has been added successfully.';
            this.closeCreateModal();
            this.loadEvents();
          },
          error: () => {
            this.isSavingCreate = false;
            this.successMessage = 'Event has been added successfully, but some images could not be uploaded.';
            this.closeCreateModal();
            this.loadEvents();
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingCreate = false;
        this.handleCreateApiError(error, 'Error while creating event.');
      }
    });
  }

  onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.mainImageFile = input.files?.[0] || null;
  }

  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incomingFiles = Array.from(input.files || []);
    this.galleryFiles = this.mergeUniqueFiles(this.galleryFiles, incomingFiles);
  }

  removeGalleryFile(index: number): void {
    this.galleryFiles = this.galleryFiles.filter((_, fileIndex) => fileIndex !== index);
  }

  startEdit(event: EventDto): void {
    if (!event.id) {
      return;
    }

    if (this.isRefusedStatus(event.status)) {
      this.errorMessage = 'Impossible de modifier un événement refusé.';
      return;
    }

    this.editingEventId = event.id;
    this.editingEvent = event;
    this.errorMessage = '';
    this.successMessage = '';
    this.editFieldErrors = {};
    this.editExistingMainImageUrl = this.cleanString(event.imageUrl) || '';
    this.editMainImageFile = null;
    this.editGalleryFiles = [];
    this.editExistingGallery = [];
    this.isSavingEdit = false;
    this.refreshDateTimeConstraints();

    this.editEventModel = {
      name: event.name,
      description: event.description,
      location: event.location,
      eventType: event.eventType,
      latitude: event.latitude,
      longitude: event.longitude,
      startDate: this.toDateTimeLocal(event.startDate),
      endDate: this.toDateTimeLocal(event.endDate),
      status: event.status,
      categoryId: event.categoryId,
      maxCapacity: event.maxCapacity ?? event.capacity,
      currentParticipants: event.currentParticipants ?? event.occupiedPlaces,
      price: event.price,
      userId: event.userId
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
    this.editEventModel = {};
    this.editFieldErrors = {};
    this.selectedEditCoordinates = '';
    this.editExistingMainImageUrl = '';
    this.editMainImageFile = null;
    this.editGalleryFiles = [];
    this.editExistingGallery = [];
    this.isSavingEdit = false;
    this.weatherPreview = null;
    this.editMap?.remove();
    this.editMap = undefined;
    this.editMarker = undefined;
  }

  onEditMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editMainImageFile = input.files?.[0] || null;
  }

  onEditGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incomingFiles = Array.from(input.files || []);
    this.editGalleryFiles = this.mergeUniqueFiles(this.editGalleryFiles, incomingFiles);
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
    if (this.isSavingEdit) {
      return;
    }

    const startDate = this.toDate(this.editEventModel.startDate);
    const endDate = this.toDate(this.editEventModel.endDate);
    const existingImageValue = this.cleanString(this.editExistingMainImageUrl) || this.cleanString(this.editingEvent?.imageUrl);

    const payload: UpdateEventRequest = {
      ...this.editEventModel,
      name: this.cleanString(this.editEventModel.name),
      description: this.cleanString(this.editEventModel.description),
      location: this.cleanString(this.editEventModel.location),
      eventType: this.editEventModel.eventType,
      imageUrl: existingImageValue,
      startDate: startDate ? this.formatDateForBackend(startDate) : undefined,
      endDate: endDate ? this.formatDateForBackend(endDate) : undefined,
      latitude: this.toOptionalNumber(this.editEventModel.latitude),
      longitude: this.toOptionalNumber(this.editEventModel.longitude),
      categoryId: this.toOptionalNumber(this.editEventModel.categoryId),
      maxCapacity: this.toOptionalNumber(this.editEventModel.maxCapacity),
      currentParticipants: this.toOptionalNumber(this.editEventModel.currentParticipants),
      price: this.toOptionalNumber(this.editEventModel.price),
      status: this.cleanString(this.editEventModel.status)
    };

    this.editFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
    this.isSavingEdit = true;

    this.eventService.update(eventId, payload).subscribe({
      next: updatedEvent => {
        this.errorMessage = '';
        this.editingEvent = updatedEvent;
        this.lastSavedEvent = updatedEvent;
        if (updatedEvent?.temperature !== undefined) {
          this.weatherPreview = {
            temperature: updatedEvent.temperature,
            precipitationMm: updatedEvent.precipitationMm,
            windSpeedKmh: updatedEvent.windSpeedKmh,
            weatherLabel: updatedEvent.weatherLabel
          };
        }
        this.uploadEditImages(eventId).subscribe({
          next: () => {
            this.successMessage = 'Event updated successfully.';
            this.isSavingEdit = false;
            this.loadEvents();
          },
          error: () => {
            this.successMessage = 'Event updated, but some images could not be uploaded.';
            this.isSavingEdit = false;
            this.loadEvents();
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingEdit = false;
        this.handleApiError(error, 'Unable to update event.');
      }
    });
  }

  openCategoryCreateModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.newCategoryModel = { name: '', description: '' };
    this.isCategoryCreateModalOpen = true;
  }

  closeCategoryCreateModal(): void {
    this.isCategoryCreateModalOpen = false;
    this.isSavingCategory = false;
    this.newCategoryModel = { name: '', description: '' };
  }

  createCategory(): void {
    if (this.isSavingCategory) {
      return;
    }

    const name = (this.newCategoryModel.name || '').trim();
    if (!name) {
      this.errorMessage = 'Category name is required.';
      return;
    }

    this.isSavingCategory = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.createCategory({
      name,
      description: this.cleanString(this.newCategoryModel.description)
    }).subscribe({
      next: () => {
        this.isSavingCategory = false;
        this.closeCategoryCreateModal();
        this.successMessage = 'Category created successfully.';
        this.loadCategories();
      },
      error: () => {
        this.isSavingCategory = false;
        this.errorMessage = 'Unable to create category.';
      }
    });
  }

  startCategoryEdit(category: CategoryDto): void {
    this.editingCategoryId = category.id;
    this.editCategoryModel = {
      name: category.name,
      description: category.description || ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelCategoryEdit(): void {
    this.editingCategoryId = null;
    this.editCategoryModel = { name: '', description: '' };
    this.isSavingCategory = false;
  }

  saveCategoryEdit(): void {
    if (!this.editingCategoryId || this.isSavingCategory) {
      return;
    }

    const name = (this.editCategoryModel.name || '').trim();
    if (!name) {
      this.errorMessage = 'Category name is required.';
      return;
    }

    this.isSavingCategory = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.updateCategory(this.editingCategoryId, {
      name,
      description: this.cleanString(this.editCategoryModel.description)
    }).subscribe({
      next: () => {
        this.isSavingCategory = false;
        this.successMessage = 'Category updated successfully.';
        this.cancelCategoryEdit();
        this.loadCategories();
      },
      error: () => {
        this.isSavingCategory = false;
        this.errorMessage = 'Unable to update category.';
      }
    });
  }

  deleteCategory(categoryId: number): void {
    if (!window.confirm('Delete this category?')) {
      return;
    }

    this.eventService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.successMessage = 'Category deleted successfully.';
        this.loadCategories();
      },
      error: () => {
        this.errorMessage = 'Unable to delete category.';
      }
    });
  }

  openDetailModal(event: EventDto): void {
    if (!event.id) {
      return;
    }

    this.detailModalEvent = event;
    this.detailModalReactions = {};
    this.detailModalComments = [];
    this.detailModalParticipants = [];
    this.isDetailModalLoading = true;
    this.mapOpenUrl = null;

    forkJoin({
      eventDetails: this.eventService.getById(event.id),
      reactions: this.reactionService.getSummary(event.id).pipe(
        map(summary => summary.reactionCounts || {}),
        catchError(() => of({}))
      ),
      comments: this.commentService.getByEvent(event.id).pipe(catchError(() => of([]))),
      participants: this.participantService.getByEvent(event.id).pipe(catchError(() => of([])))
    }).subscribe({
      next: result => {
        this.detailModalEvent = result.eventDetails;
        this.detailModalReactions = result.reactions as Partial<Record<ReactionType, number>>;
        this.detailModalComments = (result.comments as CommentDto[]) || [];
        this.detailModalParticipants = (result.participants as ParticipantDto[]) || [];
        this.isDetailModalLoading = false;
        setTimeout(() => this.initDetailMap(), 0);
      },
      error: () => {
        this.isDetailModalLoading = false;
      }
    });
  }

  closeDetailModal(): void {
    this.detailModalEvent = null;
    this.detailModalReactions = {};
    this.detailModalComments = [];
    this.detailModalParticipants = [];
    this.isDetailModalLoading = false;
    this.mapOpenUrl = null;
    this.detailMap?.remove();
    this.detailMap = undefined;
    this.detailMarker = undefined;
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

  getCategoryName(event: EventDto): string {
    if (event.categoryName?.trim()) {
      return event.categoryName;
    }

    const categoryId = Number(event.categoryId || 0);
    if (!categoryId) {
      return 'N/A';
    }

    return this.categories.find(category => category.id === categoryId)?.name || 'N/A';
  }

  getCreatorName(event: EventDto): string {
    if (!event.userId) {
      return 'Unknown';
    }

    return this.creatorByUserId[event.userId]?.name || 'Unknown';
  }

  getCreatorEmail(event: EventDto): string {
    if (!event.userId) {
      return 'N/A';
    }

    return this.creatorByUserId[event.userId]?.email || 'N/A';
  }

  getStatusBadgeClass(status: string): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'ACCEPTED') {
      return 'badge-green';
    }
    if (normalized === 'REFUSED') {
      return 'badge-red';
    }
    if (normalized === 'PENDING') {
      return 'badge-yellow';
    }
    return 'badge-blue';
  }

  getStatusLabel(status?: string): string {
    switch (this.normalizeStatus(status)) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REFUSED':
        return 'Refusé';
      default:
        return status || 'N/A';
    }
  }

  isAcceptedStatus(status?: EventStatus): boolean {
    return this.normalizeStatus(status) === 'ACCEPTED';
  }

  isRefusedStatus(status?: EventStatus): boolean {
    return this.normalizeStatus(status) === 'REFUSED';
  }

  isPendingStatus(status?: EventStatus): boolean {
    return this.normalizeStatus(status) === 'PENDING';
  }

  getEventCover(event: EventDto | null): string {
    return event?.imageUrl?.trim() || this.fallbackCover;
  }

  getModalReactionCount(type: ReactionType): number {
    return Number(this.detailModalReactions[type] || 0);
  }

  getWeatherBadgeClass(label?: string): string {
    const map: Record<string, string> = {
      'Clear': 'bg-warning text-dark',
      'Clouds': 'bg-secondary text-white',
      'Rain': 'bg-primary text-white',
      'Snow': 'bg-info text-dark border',
      'Fog': 'bg-light text-dark border',
      'Thunderstorm': 'bg-danger text-white',
      'Unknown': 'bg-dark text-white'
    };
    return map[label ?? ''] ?? 'bg-dark text-white';
  }

  
  exportParticipantsPdf(eventId: number): void {
    const base = environment.eventServiceUrl.replace(/\/+$/, '');
    const url = `${base}/api/export/participants/${eventId}/pdf`;
    console.log('Export URL:', url);  // ← vérifie dans la console
    window.open(url, '_blank');
  }


  getModalMaxCapacity(): number {
    if (!this.detailModalEvent) {
      return 0;
    }

    return Number(this.detailModalEvent.maxCapacity ?? this.detailModalEvent.capacity ?? 0);
  }

  getModalParticipantsCount(): number {
    if (this.detailModalParticipants.length > 0) {
      return this.detailModalParticipants.length;
    }

    return Number(this.detailModalEvent?.currentParticipants ?? this.detailModalEvent?.occupiedPlaces ?? 0);
  }

  getModalRemainingSpots(): number {
    const maxCapacity = this.getModalMaxCapacity();
    if (maxCapacity <= 0) {
      return 0;
    }

    return Math.max(maxCapacity - this.getModalParticipantsCount(), 0);
  }

  getModalAvailabilityClass(): string {
    const maxCapacity = this.getModalMaxCapacity();
    if (maxCapacity <= 0) {
      return 'availability-orange';
    }

    const remaining = this.getModalRemainingSpots();
    if (remaining <= 0) {
      return 'availability-red';
    }

    const ratio = remaining / maxCapacity;
    return ratio > 0.5 ? 'availability-green' : 'availability-orange';
  }

  getModalAvailabilityLabel(): string {
    const maxCapacity = this.getModalMaxCapacity();
    if (maxCapacity <= 0) {
      return 'Capacity unavailable';
    }

    const remaining = this.getModalRemainingSpots();
    if (remaining <= 0) {
      return 'Full';
    }

    const ratio = remaining / maxCapacity;
    return ratio > 0.5 ? 'Available' : 'Almost full';
  }

  // Backward-compatible aliases in case some templates still use old method names.
  approveEvent(eventId: number): void {
    this.acceptEvent(eventId);
  }

  rejectEvent(eventId: number): void {
    this.refuseEvent(eventId);
  }

  private autoDismissMessages(): void {
    setInterval(() => {
      if (this.successMessage) {
        this.successMessage = '';
      }
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    }, 3000);
  }

  private loadCreators(events: EventDto[]): void {
    const userIds = Array.from(new Set(events
      .map(event => event.userId)
      .filter((userId): userId is number => !!userId)));

    if (userIds.length === 0) {
      this.creatorByUserId = {};
      return;
    }

    const base = environment.apiBaseUrl.replace(/\/+$/, '');

    const requests: Observable<CreatorRow>[] = userIds.map(userId =>
      this.http.get<any>(`${base}/users/${userId}`, {
        withCredentials: environment.auth.withCredentials,
      }).pipe(
        map((user: any): CreatorRow => ({
          userId,
          name: `${user?.username || ''} ${user?.lastname || ''}`.trim() || `User #${userId}`,
          email: user?.email || ''
        })),
        catchError(() => of({ userId, name: `User #${userId}`, email: '' }))
      )
    );

    forkJoin(requests).subscribe((rows: CreatorRow[]) => {
      const mapById: Record<number, EventCreatorInfo> = {};
      rows.forEach(row => {
        mapById[row.userId] = { name: row.name, email: row.email };
      });
      this.creatorByUserId = mapById;
    });
  }

  private loadCategories(): void {
    this.eventService.getCategories().subscribe({
      next: categories => {
        this.categories = categories || [];
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  private loadStats(): void {
  const base = environment.eventServiceUrl;
  this.http.get<StatsDTO>(`${base}/api/stats`).subscribe({  // ← sans withCredentials
    next: stats => this.stats = stats,
    error: () => this.stats = null
  });
}

  private initCreateMap(): void {
    const container = document.getElementById('create-map-modal') as HTMLDivElement | null;
    if (!container || !this.isCreateModalOpen) {
      return;
    }

    const lat = this.createEventModel.latitude ?? this.defaultCenter[0];
    const lng = this.createEventModel.longitude ?? this.defaultCenter[1];

    this.createMap?.remove();

    this.createMap = new maplibregl.Map({
      container,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [lng, lat],
      zoom: 12,
      attributionControl: false
    });

    this.createMap.on('load', () => {
      this.initCreateMarker();
      this.createMap?.resize();
    });

    this.createMap.on('click', mapEvent => {
      const { lng, lat } = mapEvent.lngLat;
      this.setCreateCoordinatesFromMap(lat, lng);
    });
  }

  private initCreateMarker(): void {
    const lat = this.createEventModel.latitude ?? this.defaultCenter[0];
    const lng = this.createEventModel.longitude ?? this.defaultCenter[1];

    if (!this.createMap) {
      return;
    }

    if (!this.createMarker) {
      this.createMarker = new maplibregl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(this.createMap);

      this.createMarker.on('dragend', () => {
        const markerPosition = this.createMarker?.getLngLat();
        if (!markerPosition) {
          return;
        }
        this.setCreateCoordinatesFromMap(markerPosition.lat, markerPosition.lng, false);
      });
    } else {
      this.createMarker.setLngLat([lng, lat]);
    }

    this.createMap.easeTo({ center: [lng, lat], zoom: 12, duration: 0 });
  }

  private setCreateCoordinatesFromMap(latitude: number, longitude: number, moveMap = true): void {
    this.createEventModel.latitude = Number(latitude.toFixed(7));
    this.createEventModel.longitude = Number(longitude.toFixed(7));
    this.selectedCreateCoordinates = `${this.createEventModel.latitude.toFixed(6)}, ${this.createEventModel.longitude.toFixed(6)}`;
    this.tryLoadCreateWeatherPreview();

    if (this.createMarker) {
      this.createMarker.setLngLat([this.createEventModel.longitude, this.createEventModel.latitude]);
    }

    if (moveMap && this.createMap) {
      this.createMap.easeTo({
        center: [this.createEventModel.longitude, this.createEventModel.latitude],
        duration: 150
      });
    }
  }

  private initEditMap(): void {
    if (!this.editingEventId) {
      return;
    }

    const container = document.getElementById(`edit-map-${this.editingEventId}`) as HTMLDivElement | null;
    if (!container) {
      return;
    }

    const lat = this.editEventModel.latitude ?? this.defaultCenter[0];
    const lng = this.editEventModel.longitude ?? this.defaultCenter[1];

    this.editMap?.remove();

    this.editMap = new maplibregl.Map({
      container,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [lng, lat],
      zoom: 12,
      attributionControl: false
    });

    this.editMap.on('load', () => {
      this.initEditMarker();
      this.editMap?.resize();
    });

    this.editMap.on('click', mapEvent => {
      const { lng, lat } = mapEvent.lngLat;
      this.setEditCoordinatesFromMap(lat, lng);
    });
  }

  private initEditMarker(): void {
    const lat = this.editEventModel.latitude ?? this.defaultCenter[0];
    const lng = this.editEventModel.longitude ?? this.defaultCenter[1];

    if (!this.editMap) {
      return;
    }

    if (!this.editMarker) {
      this.editMarker = new maplibregl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(this.editMap);

      this.editMarker.on('dragend', () => {
        const markerPosition = this.editMarker?.getLngLat();
        if (!markerPosition) {
          return;
        }
        this.setEditCoordinatesFromMap(markerPosition.lat, markerPosition.lng, false);
      });
    } else {
      this.editMarker.setLngLat([lng, lat]);
    }

    this.editMap.easeTo({ center: [lng, lat], zoom: 12, duration: 0 });
  }

  private setEditCoordinatesFromMap(latitude: number, longitude: number, moveMap = true): void {
    this.editEventModel.latitude = Number(latitude.toFixed(7));
    this.editEventModel.longitude = Number(longitude.toFixed(7));
    this.selectedEditCoordinates = `${this.editEventModel.latitude.toFixed(6)}, ${this.editEventModel.longitude.toFixed(6)}`;

    if (this.editMarker) {
      this.editMarker.setLngLat([this.editEventModel.longitude, this.editEventModel.latitude]);
    }

    if (moveMap && this.editMap) {
      this.editMap.easeTo({
        center: [this.editEventModel.longitude, this.editEventModel.latitude],
        duration: 150
      });
    }
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

  private initDetailMap(): void {
    const container = document.getElementById('admin-detail-map') as HTMLDivElement | null;
    if (!container || !this.detailModalEvent) {
      return;
    }

    this.detailMap?.remove();

    this.detailMap = new maplibregl.Map({
      container,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [this.defaultCenter[1], this.defaultCenter[0]],
      zoom: 11,
      attributionControl: false
    });

    this.detailMap.on('load', () => {
      this.updateDetailMap(this.detailModalEvent?.latitude, this.detailModalEvent?.longitude);
      this.detailMap?.resize();
    });
  }

  private updateDetailMap(latitude?: number | null, longitude?: number | null): void {
    this.mapOpenUrl = this.buildMapOpenUrl(latitude ?? undefined, longitude ?? undefined);

    if (!this.detailMap || !this.hasValidCoordinates(latitude, longitude)) {
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!this.detailMarker) {
      this.detailMarker = new maplibregl.Marker({ color: '#1d4ed8' })
        .setLngLat([lng, lat])
        .addTo(this.detailMap);
    } else {
      this.detailMarker.setLngLat([lng, lat]);
    }

    this.detailMap.easeTo({ center: [lng, lat], zoom: 13, duration: 250 });
  }

  private buildMapOpenUrl(lat?: number, lng?: number): string | null {
    if (!this.hasValidCoordinates(lat, lng)) {
      return null;
    }

    return `https://www.openstreetmap.org/?mlat=${Number(lat).toFixed(6)}&mlon=${Number(lng).toFixed(6)}#map=15/${Number(lat).toFixed(6)}/${Number(lng).toFixed(6)}`;
  }

  private hasValidCoordinates(latitude?: number | null, longitude?: number | null): boolean {
    return latitude !== null
      && longitude !== null
      && latitude !== undefined
      && longitude !== undefined
      && Number.isFinite(Number(latitude))
      && Number.isFinite(Number(longitude));
  }

  private handleApiError(error: HttpErrorResponse, fallbackMessage: string): void {
    this.editFieldErrors = this.extractFieldErrors(error);
    this.errorMessage = this.buildGlobalError(error, fallbackMessage, this.editFieldErrors);
  }

  private handleCreateApiError(error: HttpErrorResponse, fallbackMessage: string): void {
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

  private uploadCreateImages(eventId: number): Observable<void> {
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

  private resetCreateForm(): void {
    this.createEventModel = this.buildDefaultCreateModel();
    this.createFieldErrors = {};
    this.selectedCreateCoordinates = '';
    this.createWeatherPreview = null;
    this.isCreateWeatherLoading = false;
    this.mainImageFile = null;
    this.galleryFiles = [];
  }

  onCreateWeatherInputsChanged(): void {
    this.tryLoadCreateWeatherPreview();
  }

  private tryLoadCreateWeatherPreview(): void {
    const latitude = this.toOptionalNumber(this.createEventModel.latitude);
    const longitude = this.toOptionalNumber(this.createEventModel.longitude);
    const start = this.toDate(this.createEventModel.startDate);
    const end = this.toDate(this.createEventModel.endDate);

    if (latitude === undefined || longitude === undefined || !start) {
      this.createWeatherPreview = null;
      this.isCreateWeatherLoading = false;
      return;
    }

    this.isCreateWeatherLoading = true;
    this.eventService.getWeatherPreview(
      latitude,
      longitude,
      this.toIsoDate(start),
      end ? this.toIsoDate(end) : undefined
    ).subscribe({
      next: preview => {
        this.createWeatherPreview = preview;
        this.isCreateWeatherLoading = false;
      },
      error: () => {
        this.createWeatherPreview = null;
        this.isCreateWeatherLoading = false;
      }
    });
  }

  private toIsoDate(value: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  private buildDefaultCreateModel(): CreateEventRequest {
    return {
      name: '',
      description: '',
      location: '',
      eventType: 'OUTDOOR',
      price: undefined,
      latitude: undefined,
      longitude: undefined,
      startDate: '',
      endDate: '',
      status: 'PENDING',
      categoryId: this.categories[0]?.id || 0,
      maxCapacity: 1,
      currentParticipants: 0
    };
  }

  private mergeUniqueFiles(existingFiles: File[], newFiles: File[]): File[] {
    const mapBySignature = new Map<string, File>();

    [...existingFiles, ...newFiles].forEach(file => {
      const signature = `${file.name}|${file.size}|${file.lastModified}`;
      mapBySignature.set(signature, file);
    });

    return Array.from(mapBySignature.values());
  }

  private cleanString(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private refreshDateTimeConstraints(): void {
    this.dateTimeMin = this.buildDateTimeLocalValue(new Date());
  }

  private buildDateTimeLocalValue(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  private toOptionalNumber(value?: number | null): number | undefined {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
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

  private calculateDaysUntilEvent(startDate: Date): number {
    const today = new Date();
    const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const eventAtMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((eventAtMidnight.getTime() - todayAtMidnight.getTime()) / msPerDay);
    return Math.max(diffDays, 0);
  }

  private buildExternalPredictionRequest(
    payload: CreateEventRequest,
    startDate: Date | null,
    endDate: Date | null
  ): ExternalPredictionRequest | null {
    if (!startDate) {
      return null;
    }

    const safeEndDate = endDate && endDate >= startDate ? endDate : startDate;
    const durationDays = Math.max(
      Math.ceil((safeEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
      1
    );
    const eventDay = startDate.getDay();

    return {
      category_id: Number(payload.categoryId),
      price: Number(payload.price ?? 0),
      is_free: !payload.price || Number(payload.price) === 0 ? 1 : 0,
      max_capacity: Number(payload.maxCapacity),
      event_type: String(payload.eventType ?? ''),
      is_weekend: eventDay === 0 || eventDay === 6 ? 1 : 0,
      is_holiday: 0,
      duration_days: durationDays,
      days_until_event: this.calculateDaysUntilEvent(startDate),
      temperature: Number(this.createWeatherPreview?.temperature ?? 20),
      precipitation_mm: Number(this.createWeatherPreview?.precipitationMm ?? 0),
      wind_speed_kmh: Number(this.createWeatherPreview?.windSpeedKmh ?? 0)
    };
  }

  private getCurrentUserId(): number | undefined {
    const userId = Number(localStorage.getItem('userId'));
    return Number.isFinite(userId) && userId > 0 ? userId : undefined;
  }

  private normalizeStatus(status?: string): string {
    switch (String(status || '').toUpperCase()) {
      case 'APPROVED':
        return 'ACCEPTED';
      case 'REJECTED':
        return 'REFUSED';
      default:
        return String(status || '').toUpperCase();
    }
  }
}
