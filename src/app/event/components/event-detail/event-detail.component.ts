import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { CommentDto } from '../../models/comment.model';
import { EventImageDto } from '../../models/event-image.model';
import { EventDto } from '../../models/event.model';
import { ParticipantDto } from '../../models/participant.model';
import { REACTION_EMOJI, ReactionType } from '../../models/reaction.model';
import { CommentService } from '../../services/comment.service';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { ReactionService } from '../../services/reaction.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent implements OnInit {
  @ViewChild('galleryStrip') galleryStrip?: ElementRef<HTMLDivElement>;

  eventId: number | null = null;
  event: EventDto | null = null;
  gallery: EventImageDto[] = [];
  comments: CommentDto[] = [];
  commentCount = 0;
  participants: ParticipantDto[] = [];
  reactionCounts: Partial<Record<ReactionType, number>> = {};
  selectedReaction: ReactionType | null = null;
  readonly reactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
  readonly reactionEmoji = REACTION_EMOJI;

  commentDraft = '';
  editingCommentId: number | null = null;
  editingCommentContent = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  mapUrl: SafeResourceUrl | null = null;
  mapOpenUrl: string | null = null;
  activeImageUrl: string | null = null;
  currentUserId: number | null = null;
  currentUserName = '';
  currentUserEmail = '';

  readonly fallbackCover = 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly reactionService: ReactionService,
    private readonly commentService: CommentService,
    private readonly participantService: ParticipantService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.bootstrapUserContext();

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
    this.loadComments(id);
    this.loadCommentCount(id);
    this.loadParticipants(id);
    this.selectedReaction = this.readLocalReaction(id, this.currentUserId);
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
          this.errorMessage = 'Unable to load event details.';
          this.isLoading = false;
          return;
        }

        this.applyLoadedEvent(fallback);
        this.errorMessage = 'Details endpoint returned an error. Showing fallback event data.';
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load event details.';
        this.isLoading = false;
      }
    });
  }

  react(type: ReactionType): void {
    if (!this.eventId || !this.currentUserId || !this.currentUserEmail) {
      this.errorMessage = 'You must be logged in to react.';
      return;
    }

    const current = this.selectedReaction;
    if (current === type) {
      this.reactionService.remove(this.eventId, this.currentUserEmail).subscribe({
        next: () => {
          this.selectedReaction = null;
          this.storeLocalReaction(this.eventId!, this.currentUserId!, null);
          this.loadReactionSummary(this.eventId!);
        },
        error: () => {
          this.errorMessage = 'Unable to remove reaction.';
        }
      });
      return;
    }

    this.reactionService.addOrUpdate({
      type,
      authorName: this.currentUserName,
      authorEmail: this.currentUserEmail,
      eventId: this.eventId
    }).subscribe({
      next: () => {
        this.selectedReaction = type;
        this.storeLocalReaction(this.eventId!, this.currentUserId!, type);
        this.loadReactionSummary(this.eventId!);
      },
      error: () => {
        this.errorMessage = 'Unable to save reaction.';
      }
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

    this.commentService.add({
      content,
      authorName: this.currentUserName,
      authorEmail: this.currentUserEmail,
      eventId: this.eventId,
      userId: this.currentUserId
    }).subscribe({
      next: created => {
        this.commentDraft = '';
        if (created.id && this.currentUserId) {
          this.storeCommentOwner(created.id, this.currentUserId);
        }
        this.loadComments(this.eventId!);
        this.loadCommentCount(this.eventId!);
      },
      error: () => {
        this.errorMessage = 'Unable to add comment.';
      }
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

    this.commentService.update(comment.id, {
      ...comment,
      content,
      eventId: this.eventId,
      userId: comment.userId
    }).subscribe({
      next: () => {
        this.cancelEditComment();
        this.loadComments(this.eventId!);
      },
      error: () => {
        this.errorMessage = 'Unable to update comment.';
      }
    });
  }

  deleteComment(commentId?: number): void {
    if (!commentId || !this.eventId) {
      return;
    }

    this.commentService.remove(commentId).subscribe({
      next: () => {
        this.loadComments(this.eventId!);
        this.loadCommentCount(this.eventId!);
      },
      error: () => {
        this.errorMessage = 'Unable to delete comment.';
      }
    });
  }

  canManageComment(comment: CommentDto): boolean {
    return !!this.currentUserId && comment.userId === this.currentUserId;
  }

  private loadReactionSummary(eventId: number): void {
    this.reactionService.getSummary(eventId).subscribe({
      next: summary => {
        this.reactionCounts = summary.reactionCounts || {};
      },
      error: () => {
        this.reactionCounts = {};
      }
    });
  }

  private loadComments(eventId: number): void {
    this.commentService.getByEvent(eventId).subscribe({
      next: items => {
        this.comments = items.map(item => ({
          ...item,
          userId: item.id ? this.readCommentOwner(item.id) : undefined
        }));
      },
      error: () => {
        this.comments = [];
      }
    });
  }

  private loadCommentCount(eventId: number): void {
    this.commentService.countByEvent(eventId).subscribe({
      next: value => {
        this.commentCount = Number(value || 0);
      },
      error: () => {
        this.commentCount = this.comments.length;
      }
    });
  }

  private loadParticipants(eventId: number): void {
    this.participantService.getByEvent(eventId).subscribe({
      next: data => {
        this.participants = data;
      },
      error: () => {
        this.participants = [];
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
            this.activeImageUrl = imageUrl;
          }
        }

        if (!this.activeImageUrl && images.length > 0) {
          this.activeImageUrl = this.getGalleryImage(images[0]);
        }
      },
      error: () => {
        this.gallery = [];
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
    this.activeImageUrl = event.imageUrl?.trim() || null;
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

  getDisplayedImage(): string {
    return this.activeImageUrl || this.getEventCover();
  }

  getGalleryImage(image: EventImageDto): string {
    return image.imageUrl?.trim() || image.url?.trim() || this.fallbackCover;
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

  private bootstrapUserContext(): void {
    this.currentUserId = Number(localStorage.getItem('userId')) || null;

    let storedUser: any = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      storedUser = null;
    }

    const firstName = storedUser?.firstName || 'User';
    const lastName = storedUser?.lastName || this.currentUserId || '';
    this.currentUserName = `${firstName} ${lastName}`.trim();

    const email = storedUser?.email?.trim();
    this.currentUserEmail = email || (this.currentUserId ? `user-${this.currentUserId}@local.user` : '');
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
