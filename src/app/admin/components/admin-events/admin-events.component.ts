import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EventDto, EventStatus } from '../../../event/models/event.model';
import { EventService } from '../../../event/services/event.service';
import { UserService } from '../../../user-security/services/user.service';
import { CommentDto } from '../../../event/models/comment.model';
import { ReactionType, REACTION_EMOJI } from '../../../event/models/reaction.model';
import { ParticipantDto } from '../../../event/models/participant.model';
import { CommentService } from '../../../event/services/comment.service';
import { ReactionService } from '../../../event/services/reaction.service';
import { ParticipantService } from '../../../event/services/participant.service';

interface EventCreatorInfo {
  name: string;
  email: string;
}

@Component({
  selector: 'app-admin-events',
  templateUrl: './admin-events.component.html'
})
export class AdminEventsComponent implements OnInit {
  events: EventDto[] = [];
  creatorByUserId: Record<number, EventCreatorInfo> = {};
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  detailModalEvent: EventDto | null = null;
  isDetailModalLoading = false;
  detailModalReactions: Partial<Record<ReactionType, number>> = {};
  detailModalComments: CommentDto[] = [];
  detailModalParticipants: ParticipantDto[] = [];
  readonly reactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
  readonly reactionEmoji = REACTION_EMOJI;
  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly eventService: EventService,
    private readonly userService: UserService,
    private readonly reactionService: ReactionService,
    private readonly commentService: CommentService,
    private readonly participantService: ParticipantService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.autoDismissMessages();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getAll().subscribe({
      next: events => {
        this.events = events || [];
        this.loadCreators(this.events);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load events.';
        this.isLoading = false;
      }
    });
  }

  deleteEvent(eventId: number): void {
    if (!window.confirm('Delete this event?')) return;
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

  openDetailModal(event: EventDto): void {
    if (!event.id) return;

    this.detailModalEvent = event;
    this.detailModalReactions = {};
    this.detailModalComments = [];
    this.detailModalParticipants = [];
    this.isDetailModalLoading = true;

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
        this.detailModalComments = result.comments;
        this.detailModalParticipants = result.participants;
        this.isDetailModalLoading = false;
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
    if (event.categoryId) {
      return `Category #${event.categoryId}`;
    }
    return 'N/A';
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
    const normalized = String(status || '').toUpperCase();
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
    switch ((status || '').toUpperCase()) {
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
    return String(status || '').toUpperCase() === 'ACCEPTED';
  }

  isRefusedStatus(status?: EventStatus): boolean {
    return String(status || '').toUpperCase() === 'REFUSED';
  }

  getEventCover(event: EventDto | null): string {
    return event?.imageUrl?.trim() || this.fallbackCover;
  }

  getModalReactionCount(type: ReactionType): number {
    return Number(this.detailModalReactions[type] || 0);
  }

  getModalMaxCapacity(): number {
    if (!this.detailModalEvent) return 0;
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
    if (maxCapacity <= 0) return 0;
    return Math.max(maxCapacity - this.getModalParticipantsCount(), 0);
  }

  getModalAvailabilityClass(): string {
    const maxCapacity = this.getModalMaxCapacity();
    if (maxCapacity <= 0) return 'availability-orange';

    const remaining = this.getModalRemainingSpots();
    if (remaining <= 0) return 'availability-red';

    const ratio = remaining / maxCapacity;
    return ratio > 0.5 ? 'availability-green' : 'availability-orange';
  }

  getModalAvailabilityLabel(): string {
    const maxCapacity = this.getModalMaxCapacity();
    if (maxCapacity <= 0) return 'Capacity unavailable';

    const remaining = this.getModalRemainingSpots();
    if (remaining <= 0) return 'Full';

    const ratio = remaining / maxCapacity;
    return ratio > 0.5 ? 'Available' : 'Almost full';
  }

  private autoDismissMessages(): void {
    setInterval(() => {
      if (this.successMessage) this.successMessage = '';
      if (this.errorMessage) this.errorMessage = '';
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

    const requests = userIds.map(userId =>
      this.userService.getProfileByUserId(userId).pipe(
        map((profile: any) => ({
          userId,
          name: `${profile?.firstName || profile?.username || ''} ${profile?.lastName || profile?.lastname || ''}`.trim() || `User #${userId}`,
          email: profile?.email || 'N/A'
        })),
        catchError(() => of({ userId, name: `User #${userId}`, email: 'N/A' }))
      )
    );

    forkJoin(requests).subscribe(rows => {
      const mapById: Record<number, EventCreatorInfo> = {};
      rows.forEach(row => {
        mapById[row.userId] = { name: row.name, email: row.email };
      });
      this.creatorByUserId = mapById;
    });
  }
}
