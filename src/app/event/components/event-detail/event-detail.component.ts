import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import maplibregl from 'maplibre-gl';

import { CommentDto } from '../../models/comment.model';
import { EventImageDto } from '../../models/event-image.model';
import { EventDto } from '../../models/event.model';
import { EventRatingDto } from '../../models/event-rating.model';
import { ParticipantDto } from '../../models/participant.model';
import { REACTION_EMOJI, ReactionType } from '../../models/reaction.model';
import { CommentService } from '../../services/comment.service';
import { EventService } from '../../services/event.service';
import { EventRatingService } from '../../services/event-rating.service';
import { ParticipantService } from '../../services/participant.service';
import { ReactionService } from '../../services/reaction.service';
import { BehaviorService } from '../../services/behavior.service';
import { UserService } from '../../../user-security/services/user.service';
import { loadAuthSession } from '../../../user-security/utils/auth-session.util';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('galleryStrip') galleryStrip?: ElementRef<HTMLDivElement>;
  @ViewChild('detailMapContainer') detailMapContainer?: ElementRef<HTMLDivElement>;

  eventId: number | null = null;
  event: EventDto | null = null;
  gallery: EventImageDto[] = [];
  comments: CommentDto[] = [];
  commentCount = 0;
  participants: ParticipantDto[] = [];
  participantCount = 0;
  reactionCounts: Partial<Record<ReactionType, number>> = {};
  selectedReaction: ReactionType | null = null;
  readonly reactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
  readonly reactionEmoji = REACTION_EMOJI;
  readonly ratingScale = [1, 2, 3, 4, 5];

  averageRating = 0;
  totalRatings = 0;
  selectedRating: number | null = null;
  isRatingSaving = false;
  isParticipating = false;

  commentDraft = '';
  editingCommentId: number | null = null;
  editingCommentContent = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  participationErrorMessage = '';
  participationSuccessMessage = '';
  categoryName = '';
  mapOpenUrl: string | null = null;
  activeImageUrl: string | null = null;
  currentUserId: number | null = null;
  currentUserName = '';
  currentUserEmail = '';
  currentUserPhone = '';
  similarEvents: any[] = [];
  countdownLabel = "L'événement est terminé";
  countdownValue = '';
  countdownStatus: 'before' | 'during' | 'after' = 'after';
  countdownMessage = "L'événement est terminé";

  private detailMap?: maplibregl.Map;
  private detailMarker?: maplibregl.Marker;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly defaultCenter: [number, number] = [36.8065, 10.1815];

  readonly fallbackCover = 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly reactionService: ReactionService,
    private readonly commentService: CommentService,
    private readonly ratingService: EventRatingService,
    private readonly participantService: ParticipantService,
    private readonly behaviorService: BehaviorService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.bootstrapUserContext();
    this.loadCurrentUserPhone();

    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId ? Number(rawId) : NaN;

    if (Number.isNaN(id)) {
      this.errorMessage = 'Invalid event identifier.';
      return;
    }

    this.eventId = id;
    this.loadEvent(id);
    this.loadGallery(id);
    this.loadReactionSummary(id);
    this.loadRatingSummary(id);
    this.loadCurrentUserRating(id);
    this.loadComments(id);
    this.loadCommentCount(id);
    this.loadParticipants(id);
    this.loadParticipantCount(id);
    this.getSimilarEvents(id);
    this.selectedReaction = this.readLocalReaction(id, this.currentUserId);
  }

  getSimilarEvents(eventId: number): void {
    this.eventService.getSimilarEvents(eventId, 3).subscribe({
      next: (events) => this.similarEvents = events,
      error: (err) => console.error(err)
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initDetailMap());
  }

  ngOnDestroy(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.detailMap?.remove();
  }

  private loadEvent(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getById(id).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return this.loadEventFallbackFromList(id);
      })
    ).subscribe(event => {
      if (event) {
        this.applyLoadedEvent(event);
      }

      this.isLoading = false;
    });
  }

  private loadEventFallbackFromList(id: number): Observable<EventDto | null> {
    return this.eventService.getAll().pipe(
      map(events => events.find(item => item.id === id) || null),
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(null);
      })
    );
  }

  react(type: ReactionType): void {
    if (!this.eventId || !this.currentUserId || !this.currentUserEmail) {
      this.errorMessage = 'You must be logged in to react.';
      return;
    }

    const current = this.selectedReaction;
    if (current === type) {
      this.errorMessage = '';
      this.reactionService.remove(this.eventId, this.currentUserEmail).pipe(
        map(() => true),
        catchError(err => {
          this.setBackendErrorMessage(err);
          return of(false);
        })
      ).subscribe(success => {
        if (!success) {
          return;
        }

          this.selectedReaction = null;
          this.storeLocalReaction(this.eventId!, this.currentUserId!, null);
          this.loadReactionSummary(this.eventId!);
      });
      return;
    }

    this.errorMessage = '';
    this.reactionService.addOrUpdate({
      type,
      authorName: this.currentUserName,
      authorEmail: this.currentUserEmail,
      eventId: this.eventId
    }).pipe(
      map(() => true),
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(false);
      })
    ).subscribe(success => {
      if (!success) {
        return;
      }

        this.selectedReaction = type;
        this.storeLocalReaction(this.eventId!, this.currentUserId!, type);
        this.loadReactionSummary(this.eventId!);
    });
  }

  rateEvent(rating: number): void {
    if (!this.eventId || !this.currentUserId) {
      this.errorMessage = 'You must be logged in to rate this event.';
      return;
    }

    this.isRatingSaving = true;
    this.errorMessage = '';
    this.ratingService.rate({
      eventId: this.eventId,
      userId: this.currentUserId,
      rating
    }).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        this.isRatingSaving = false;
        return of(null);
      })
    ).subscribe((response: EventRatingDto | null) => {
      if (!response) {
        return;
      }

        this.selectedRating = response.rating ?? rating;
        this.averageRating = response.averageRating ?? this.averageRating;
        this.totalRatings = response.totalRatings ?? this.totalRatings;
        this.errorMessage = '';
        this.isRatingSaving = false;
    });
  }

  participateInEvent(): void {
    this.participationErrorMessage = '';
    this.participationSuccessMessage = '';

    if (!this.eventId || !this.currentUserEmail) {
      this.participationErrorMessage = 'You must be logged in to participate.';
      return;
    }

    if (this.hasCurrentUserParticipated()) {
      this.participationSuccessMessage = 'You are already registered for this event.';
      return;
    }

    const eventId = this.eventId;

    const normalizedPhone = this.currentUserPhone?.trim();
    const phoneAlreadyUsed = normalizedPhone
      ? this.participants.some(p => p.phone?.trim() === normalizedPhone)
      : false;

    if (phoneAlreadyUsed) {
      this.participationSuccessMessage = 'You are already registered for this event.';
      return;
    }

    this.isParticipating = true;
    this.participantService.add({
      fullName: this.currentUserName || 'User',
      email: this.currentUserEmail,
      phone: normalizedPhone || undefined,
      eventId
    }).pipe(
      map(() => true),
      catchError(err => {
        this.participationErrorMessage = this.extractBackendErrorMessage(err);
        this.isParticipating = false;
        return of(false);
      })
    ).subscribe(success => {
      if (!success) {
        return;
      }

        this.participationSuccessMessage = 'Your participation has been registered.';
        this.isParticipating = false;
        this.loadParticipants(this.eventId!);
        this.loadParticipantCount(this.eventId!);
        this.recordBehavior('PARTICIPATE');
    });
  }

  getReactionCount(type: ReactionType): number {
    return Number(this.reactionCounts[type] || 0);
  }

  isReactionActive(type: ReactionType): boolean {
    return this.selectedReaction === type;
  }

  addComment(): void {
    if (!this.eventId || !this.currentUserId || !this.currentUserEmail) {
      this.errorMessage = 'You must be logged in to comment.';
      return;
    }

    const content = this.commentDraft.trim();
    if (!content) {
      this.errorMessage = 'Comment content is required.';
      return;
    }

    if (content.length > 1000) {
      this.errorMessage = 'Comment must not exceed 1000 characters.';
      return;
    }

    this.errorMessage = '';
    this.commentService.add({
      content,
      authorName: this.currentUserName,
      authorEmail: this.currentUserEmail,
      eventId: this.eventId,
      userId: this.currentUserId
    }).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(null);
      })
    ).subscribe(created => {
      if (!created) {
        return;
      }

        this.commentDraft = '';
        if (created.id && this.currentUserId) {
          this.storeCommentOwner(created.id, this.currentUserId);
        }
        this.loadComments(this.eventId!);
        this.loadCommentCount(this.eventId!);
    });
  }

  startEditComment(comment: CommentDto): void {
    this.editingCommentId = comment.id || null;
    this.editingCommentContent = comment.content;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  saveComment(comment: CommentDto): void {
    if (!comment.id || !this.eventId) {
      return;
    }

    const content = this.editingCommentContent.trim();
    if (!content) {
      this.errorMessage = 'Comment content is required.';
      return;
    }

    this.errorMessage = '';
    this.commentService.update(comment.id, {
      ...comment,
      content,
      eventId: this.eventId,
      userId: comment.userId
    }).pipe(
      map(() => true),
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(false);
      })
    ).subscribe(success => {
      if (!success) {
        return;
      }

        this.cancelEditComment();
        this.loadComments(this.eventId!);
    });
  }

  deleteComment(commentId?: number): void {
    if (!commentId || !this.eventId) {
      return;
    }

    this.errorMessage = '';
    this.commentService.remove(commentId).pipe(
      map(() => true),
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(false);
      })
    ).subscribe(success => {
      if (!success) {
        return;
      }

        this.loadComments(this.eventId!);
        this.loadCommentCount(this.eventId!);
    });
  }

  canManageComment(comment: CommentDto): boolean {
    return !!this.currentUserId && comment.userId === this.currentUserId;
  }

  canRate(): boolean {
    return !!this.eventId && !!this.currentUserId;
  }

  canParticipate(): boolean {
    return !!this.eventId && !!this.currentUserEmail && !this.hasCurrentUserParticipated();
  }

  hasCurrentUserParticipated(): boolean {
    if (!this.currentUserEmail) {
      return false;
    }

    const normalizedEmail = this.currentUserEmail.trim().toLowerCase();
    return this.participants.some(participant => participant.email?.trim().toLowerCase() === normalizedEmail);
  }

  getRatingLabel(): string {
    if (!this.totalRatings) {
      return 'No ratings yet';
    }

    return `${this.averageRating.toFixed(1)} / 5 from ${this.totalRatings} rating${this.totalRatings > 1 ? 's' : ''}`;
  }

  private loadReactionSummary(eventId: number): void {
    this.reactionService.getSummary(eventId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of({ reactionCounts: {} as Partial<Record<ReactionType, number>> });
      })
    ).subscribe(summary => {
      this.reactionCounts = summary.reactionCounts || {};
    });
  }

  private loadComments(eventId: number): void {
    this.commentService.getByEvent(eventId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of([] as CommentDto[]);
      })
    ).subscribe(items => {
      this.comments = items.map(item => ({
        ...item,
        userId: item.id ? this.readCommentOwner(item.id) : undefined
      }));
    });
  }

  private loadCommentCount(eventId: number): void {
    this.commentService.countByEvent(eventId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(this.comments.length);
      })
    ).subscribe(value => {
      this.commentCount = Number(value || 0);
    });
  }

  private loadParticipants(eventId: number): void {
    this.participantService.getByEvent(eventId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of([] as ParticipantDto[]);
      })
    ).subscribe(data => {
      this.participants = data;
    });
  }

  private loadParticipantCount(eventId: number): void {
    this.participantService.countByEvent(eventId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(this.participants.length);
      })
    ).subscribe(value => {
      this.participantCount = Number(value || 0);
    });
  }

  private loadRatingSummary(eventId: number): void {
    this.ratingService.getStats(eventId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of({ averageRating: 0, totalRatings: 0 } as EventRatingDto);
      })
    ).subscribe((summary: EventRatingDto) => {
      this.averageRating = summary.averageRating ?? 0;
      this.totalRatings = summary.totalRatings ?? 0;
    });
  }

  private loadCurrentUserRating(eventId: number): void {
    if (!this.currentUserId) {
      this.selectedRating = null;
      return;
    }

    this.ratingService.getUserRating(eventId, this.currentUserId).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of(null);
      })
    ).subscribe((rating: EventRatingDto | null) => {
      this.selectedRating = rating?.rating ?? null;
    });
  }

  private loadGallery(id: number): void {
    this.eventService.getGallery(id).pipe(
      catchError(err => {
        this.setBackendErrorMessage(err);
        return of([] as EventImageDto[]);
      })
    ).subscribe(images => {
      this.gallery = images;
      if ((!this.event?.imageUrl || !this.event.imageUrl.trim()) && images.length > 0) {
        const first = images.find(image => !!image.imageUrl || !!image.url);
        const imageUrl = first?.imageUrl || first?.url;
        if (this.event && imageUrl) {
          this.event = { ...this.event, imageUrl };
          this.activeImageUrl = imageUrl;
        }
      }

      if (!this.activeImageUrl && images.length > 0) {
        this.activeImageUrl = this.getGalleryImage(images[0]);
      }
    });
  }

  private loadCategoryName(categoryId?: number): void {
    if (!categoryId) {
      this.categoryName = '';
      return;
    }

    this.eventService.getCategories().pipe(
      map(categories => categories.find(category => Number(category.id) === Number(categoryId)) || null),
      catchError(err => {
        // Category is secondary metadata; avoid blocking the page with a top-level technical error.
        this.categoryName = '';
        return of(null);
      })
    ).subscribe(category => {
      this.categoryName = category?.name?.trim() || '';
    });
  }

  private buildMapOpenUrl(latitude?: number | null, longitude?: number | null): string | null {
    if (!this.hasValidCoordinates(latitude, longitude)) {
      return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
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
    this.categoryName = '';
    this.loadCategoryName(event.categoryId);
    this.startCountdown();
    this.activeImageUrl = event.imageUrl?.trim() || null;
    this.mapOpenUrl = this.buildMapOpenUrl(event.latitude, event.longitude);
    setTimeout(() => {
      this.initDetailMap();
      this.updateDetailMap(event.latitude, event.longitude);
      this.detailMap?.resize();
    }, 0);
    this.recordBehavior('VIEW');
  }

  private recordBehavior(actionType: 'VIEW' | 'PARTICIPATE' | 'BOOKMARK'): void {
    if (!this.currentUserId || !this.eventId || !this.event) {
      return;
    }

    this.behaviorService.record({
      userId: this.currentUserId,
      eventId: this.eventId,
      categoryId: this.event.categoryId,
      actionType,
      lat: this.event.latitude,
      lng: this.event.longitude
    }).subscribe({
      error: () => {
        // Behavior tracking should never block UX.
      }
    });
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

  getDisplayedImage(): string {
    return this.activeImageUrl || this.getEventCover();
  }

  getGalleryImage(image: EventImageDto): string {
    return image.imageUrl?.trim() || image.url?.trim() || this.fallbackCover;
  }

  getCategoryDisplayName(): string {
    if (!this.event) {
      return 'N/A';
    }

    const eventWithCategory = this.event as EventDto & {
      category?: { name?: string };
      categoryDto?: { name?: string };
    };

    return this.categoryName
      || this.event.categoryName
      || eventWithCategory.category?.name
      || eventWithCategory.categoryDto?.name
      || 'N/A';
  }

  private setBackendErrorMessage(err: unknown): void {
    const backendMessage = this.extractBackendErrorMessage(err);
    if (backendMessage) {
      this.errorMessage = backendMessage;
    }
  }

  private extractBackendErrorMessage(err: unknown): string {
    const backendMessage = (err as { error?: { message?: unknown } })?.error?.message;
    return typeof backendMessage === 'string' ? backendMessage.trim() : '';
  }

  setActiveImage(image: string): void {
    this.activeImageUrl = image;
  }

  scrollGallery(direction: 'left' | 'right'): void {
    const container = this.galleryStrip?.nativeElement;
    if (!container) {
      return;
    }

    const offset = container.clientWidth * 0.7;
    container.scrollBy({
      left: direction === 'right' ? offset : -offset,
      behavior: 'smooth'
    });
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

  formatShortDate(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(date);
  }

  getImageSlides(): string[] {
    const slides = [this.getEventCover(), ...this.gallery.map(image => this.getGalleryImage(image))]
      .filter(url => !!url?.trim());
    return Array.from(new Set(slides));
  }

  getImageCount(): number {
    return this.getImageSlides().length;
  }

  getActiveImageIndex(): number {
    const slides = this.getImageSlides();
    if (slides.length === 0) {
      return 0;
    }

    const current = this.getDisplayedImage();
    const index = slides.indexOf(current);
    return index >= 0 ? index : 0;
  }

  previousImage(): void {
    const slides = this.getImageSlides();
    if (slides.length <= 1) {
      return;
    }

    const currentIndex = this.getActiveImageIndex();
    const nextIndex = (currentIndex - 1 + slides.length) % slides.length;
    this.activeImageUrl = slides[nextIndex];
  }

  nextImage(): void {
    const slides = this.getImageSlides();
    if (slides.length <= 1) {
      return;
    }

    const currentIndex = this.getActiveImageIndex();
    const nextIndex = (currentIndex + 1) % slides.length;
    this.activeImageUrl = slides[nextIndex];
  }

  isFreeEvent(event?: EventDto | null): boolean {
    if (!event) {
      return false;
    }

    const price = Number(event.price);
    return Number.isFinite(price) && price === 0;
  }

  getStatusBadgeClass(event?: EventDto | null): string {
    return this.isFreeEvent(event) ? 'status-badge status-completed' : '';
  }

  getStatusLabel(event?: EventDto | null): string {
    return this.isFreeEvent(event) ? 'Gratuit' : '';
  }

  private normalizeStatus(status?: string): string {
    switch (String(status || '').toUpperCase()) {
      case 'ACCEPTED':
        return 'APPROVED';
      case 'REFUSED':
        return 'REJECTED';
      default:
        return String(status || '').toUpperCase();
    }
  }

  private bootstrapUserContext(): void {
    const session = loadAuthSession();
    const tokenPayload = this.decodeJwtPayload(session?.accessToken ?? null);

    this.currentUserId = Number(session?.user?.id) || Number(tokenPayload?.['userId']) || null;

    const user = session?.user;
    const firstName = user?.firstName || 'User';
    const lastName = user?.lastName || '';
    this.currentUserName = `${firstName} ${lastName}`.trim();

    const email = user?.email?.trim() || this.readEmailFromTokenPayload(tokenPayload);
    this.currentUserPhone = user?.phone?.trim() || '';
    this.currentUserEmail = email || '';

    if (!this.currentUserPhone && this.currentUserId) {
      this.userService.getProfileByUserId(this.currentUserId).subscribe((profile: any) => {
        if (profile?.phone?.trim()) {
          this.currentUserPhone = profile.phone.trim();
        }
      });
    }
  }

  private parseEventDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed
      .replace(' ', 'T')
      .replace(/\.(\d{3})\d+$/, '.$1')
      .replace(/\.(\d{1,2})$/, '.$100');

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private decodeJwtPayload(token: string | null): Record<string, unknown> | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const normalized = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

      const payload = atob(normalized);
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private readEmailFromTokenPayload(payload: Record<string, unknown> | null): string {
    if (!payload) {
      return '';
    }

    const tokenEmail = payload['email'] || payload['mail'] || payload['username'] || payload['sub'];
    return typeof tokenEmail === 'string' ? tokenEmail.trim().toLowerCase() : '';
  }

  private loadCurrentUserPhone(): void {
    if (!this.currentUserId) {
      return;
    }

    this.userService.getProfileByUserId(this.currentUserId).subscribe((profile: any) => {
      if (profile?.phone?.trim()) {
        this.currentUserPhone = profile.phone.trim();
      }
    });
  }

  private startCountdown(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }

    this.updateCountdownMessage();
    this.countdownIntervalId = setInterval(() => this.updateCountdownMessage(), 1000);
  }

  private updateCountdownMessage(): void {
    if (!this.event) {
      this.countdownStatus = 'after';
      this.countdownLabel = "L'événement est terminé";
      this.countdownValue = '';
      this.countdownMessage = "L'événement est terminé";
      return;
    }

    const rawStartDate = this.event.startDate || (this.event as EventDto & { start_date?: string }).start_date;
    const rawEndDate = this.event.endDate || (this.event as EventDto & { end_date?: string }).end_date;
    const startDate = this.parseEventDate(rawStartDate);
    const endDate = this.parseEventDate(rawEndDate);
    const now = new Date();

    if (!startDate || !endDate) {
      this.countdownStatus = 'after';
      this.countdownLabel = "L'événement est terminé";
      this.countdownValue = '';
      this.countdownMessage = "L'événement est terminé";
      return;
    }

    if (now < startDate) {
      this.countdownStatus = 'before';
      this.countdownLabel = "L'événement va débuter dans";
      this.countdownValue = this.formatDuration(startDate.getTime() - now.getTime());
      this.countdownMessage = `L'événement va débuter dans : ${this.countdownValue}`;
      return;
    }

    if (now < endDate) {
      this.countdownStatus = 'during';
      this.countdownLabel = "L'événement se termine dans";
      this.countdownValue = this.formatDuration(endDate.getTime() - now.getTime());
      this.countdownMessage = `L'événement se termine dans : ${this.countdownValue}`;
      return;
    }

    this.countdownStatus = 'after';
    this.countdownLabel = "L'événement est terminé";
    this.countdownValue = '';
    this.countdownMessage = "L'événement est terminé";
  }

  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [days, hours, minutes, seconds]
      .map(value => String(value).padStart(2, '0'))
      .join(':');
  }

  private initDetailMap(): void {
    if (!this.detailMapContainer?.nativeElement) {
      return;
    }

    const lat = this.event?.latitude ?? this.defaultCenter[0];
    const lng = this.event?.longitude ?? this.defaultCenter[1];

    this.detailMap?.remove();

    this.detailMap = new maplibregl.Map({
      container: this.detailMapContainer.nativeElement,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [lng, lat],
      zoom: 12,
      attributionControl: false
    });

    this.detailMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    this.detailMap.on('load', () => {
      this.updateDetailMap(this.event?.latitude, this.event?.longitude);
      this.detailMap?.resize();
    });
  }

  private updateDetailMap(latitude?: number | null, longitude?: number | null): void {
    if (!this.detailMap) {
      return;
    }

    if (!this.hasValidCoordinates(latitude, longitude)) {
      this.detailMarker?.remove();
      this.detailMarker = undefined;
      this.detailMap.easeTo({
        center: [this.defaultCenter[1], this.defaultCenter[0]],
        zoom: 11,
        duration: 0
      });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!this.detailMarker) {
      this.detailMarker = new maplibregl.Marker({ draggable: false })
        .setLngLat([lng, lat])
        .addTo(this.detailMap);
    } else {
      this.detailMarker.setLngLat([lng, lat]);
    }

    this.detailMap.easeTo({ center: [lng, lat], zoom: 14, duration: 0 });
  }

  private reactionLocalKey(eventId: number, userId: number): string {
    return `event-reaction:${eventId}:${userId}`;
  }

  private readLocalReaction(eventId: number, userId: number | null): ReactionType | null {
    if (!userId) {
      return null;
    }

    const value = localStorage.getItem(this.reactionLocalKey(eventId, userId));
    if (!value) {
      return null;
    }

    return this.reactionTypes.includes(value as ReactionType) ? (value as ReactionType) : null;
  }

  private storeLocalReaction(eventId: number, userId: number, type: ReactionType | null): void {
    const key = this.reactionLocalKey(eventId, userId);
    if (!type) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, type);
  }

  private commentOwnerKey(commentId: number): string {
    return `event-comment-owner:${commentId}`;
  }

  private storeCommentOwner(commentId: number, userId: number): void {
    localStorage.setItem(this.commentOwnerKey(commentId), String(userId));
  }

  private readCommentOwner(commentId: number): number | undefined {
    const value = Number(localStorage.getItem(this.commentOwnerKey(commentId)));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

}
