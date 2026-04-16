import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommentDto } from '../../models/comment.model';
import { CategoryDto } from '../../models/category.model';
import { EventDto } from '../../models/event.model';
import { EventImageDto } from '../../models/event-image.model';
import { ParticipantDto } from '../../models/participant.model';
import { REACTION_EMOJI, ReactionType } from '../../models/reaction.model';
import { CommentService } from '../../services/comment.service';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { ReactionService } from '../../services/reaction.service';
import { loadAuthSession } from '../../../user-security/utils/auth-session.util';

@Component({
  selector: 'app-participated-events',
  templateUrl: './participated-events.component.html',
  styleUrl: './participated-events.component.css'
})
export class ParticipatedEventsComponent implements OnInit {
  participatedEvents: EventDto[] = [];
  categories: CategoryDto[] = [];
  isLoading = false;
  errorMessage = '';

  detailModalEvent: EventDto | null = null;
  detailModalReactions: Partial<Record<ReactionType, number>> = {};
  detailModalComments: CommentDto[] = [];
  detailModalParticipants: ParticipantDto[] = [];
  isDetailModalLoading = false;
  readonly reactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
  readonly reactionEmoji = REACTION_EMOJI;

  currentUserEmail = '';
  currentUserPhone = '';

  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly eventService: EventService,
    private readonly reactionService: ReactionService,
    private readonly commentService: CommentService,
    private readonly participantService: ParticipantService
  ) {}

  ngOnInit(): void {
    this.bootstrapUserContext();
    this.loadCategories();
    this.loadParticipatedEvents();
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

  loadParticipatedEvents(): void {
    if (!this.currentUserEmail && !this.currentUserPhone) {
      this.errorMessage = 'You must be logged in to access participated events.';
      this.participatedEvents = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.getParticipatedByUser(this.currentUserEmail, this.currentUserPhone, { page: 0, size: 200 }).pipe(
      catchError(() => {
        this.errorMessage = 'Unable to load participated events.';
        return of([] as EventDto[]);
      })
    ).subscribe(events => {
      this.participatedEvents = events;
      this.isLoading = false;
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

    forkJoin({
      summary: this.reactionService.getSummary(event.id),
      comments: this.commentService.getByEvent(event.id),
      participants: this.participantService.getByEvent(event.id)
    }).subscribe({
      next: ({ summary, comments, participants }) => {
        this.detailModalReactions = summary?.reactionCounts || {};
        this.detailModalComments = comments || [];
        this.detailModalParticipants = participants || [];
        this.isDetailModalLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load event detail data.';
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

  getModalReactionCount(type: ReactionType): number {
    return Number(this.detailModalReactions[type] || 0);
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

  private bootstrapUserContext(): void {
    const session = loadAuthSession();
    const tokenPayload = this.decodeJwtPayload(session?.accessToken ?? null);

    this.currentUserEmail = (session?.user?.email?.trim() || this.readEmailFromTokenPayload(tokenPayload)).toLowerCase();
    this.currentUserPhone = session?.user?.phone?.trim() || '';
  }

  private isCurrentUserParticipant(participants: ParticipantDto[]): boolean {
    const normalizedEmail = this.currentUserEmail.trim().toLowerCase();
    const normalizedPhone = this.currentUserPhone.trim();

    return participants.some(participant => {
      const participantEmail = participant.email?.trim().toLowerCase() || '';
      const participantPhone = participant.phone?.trim() || '';

      if (normalizedEmail && participantEmail === normalizedEmail) {
        return true;
      }

      if (normalizedPhone && participantPhone === normalizedPhone) {
        return true;
      }

      return false;
    });
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
}
