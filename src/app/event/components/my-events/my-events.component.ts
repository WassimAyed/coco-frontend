import { Component, OnInit } from '@angular/core';
import { EventDto, UpdateEventRequest } from '../../models/event.model';
import { EventOwnershipService } from '../../services/event-ownership.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.css'
})
export class MyEventsComponent implements OnInit {
  myEvents: EventDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  editingEventId: number | null = null;
  editModel: UpdateEventRequest = {};

  readonly fallbackCover = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly eventService: EventService,
    private readonly ownershipService: EventOwnershipService
  ) {}

  ngOnInit(): void {
    this.loadMyEvents();
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

  startEdit(event: EventDto): void {
    this.editingEventId = event.id || null;
    this.editModel = {
      name: event.name,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      categoryId: event.categoryId,
      maxCapacity: event.maxCapacity ?? event.capacity,
      currentParticipants: event.currentParticipants ?? event.occupiedPlaces
    };
  }

  cancelEdit(): void {
    this.editingEventId = null;
    this.editModel = {};
  }

  saveEdit(eventId: number): void {
    const name = this.editModel.name?.trim();
    const location = this.editModel.location?.trim();
    const description = this.editModel.description?.trim();

    if (!name || name.length < 3 || name.length > 100) {
      this.errorMessage = 'Event name must be between 3 and 100 characters.';
      return;
    }

    if (!location) {
      this.errorMessage = 'Location is required.';
      return;
    }

    if (description && description.length > 500) {
      this.errorMessage = 'Description must not exceed 500 characters.';
      return;
    }

    if (!this.editModel.maxCapacity || this.editModel.maxCapacity <= 0) {
      this.errorMessage = 'Max capacity must be greater than 0.';
      return;
    }

    this.eventService.update(eventId, this.editModel).subscribe({
      next: () => {
        this.successMessage = 'Event updated successfully.';
        this.cancelEdit();
        this.loadMyEvents();
      },
      error: () => {
        this.errorMessage = 'Unable to update event.';
      }
    });
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
}
