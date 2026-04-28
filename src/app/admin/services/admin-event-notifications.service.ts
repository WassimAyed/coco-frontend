import { Injectable, NgZone, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AdminEventNotification {
  id: number;
  name: string;
  location?: string;
  userId?: number;
  status?: string;
  startDate?: string;
  receivedAt: number;
}

@Injectable({ providedIn: 'root' })
export class AdminEventNotificationsService {

  private readonly streamUrl = `${environment.eventApiBaseUrl}/notifications/admin-stream`;

  readonly notifications = signal<AdminEventNotification[]>([]);
  readonly connected = signal<boolean>(false);

  private eventSource: EventSource | null = null;

  constructor(private ngZone: NgZone) {}

  connect(): void {
    if (this.eventSource) return;

    this.eventSource = new EventSource(this.streamUrl);

    this.eventSource.addEventListener('connected', () => {
      this.ngZone.run(() => this.connected.set(true));
    });

    this.eventSource.addEventListener('event-created', (msg: MessageEvent) => {
      try {
        const event = JSON.parse(msg.data);
        const notif: AdminEventNotification = {
          id: event.id,
          name: event.name,
          location: event.location,
          userId: event.userId,
          status: event.status,
          startDate: event.startDate,
          receivedAt: Date.now()
        };
        this.ngZone.run(() => {
          this.notifications.update(list => [notif, ...list]);
        });
      } catch {
        // ignore malformed payload
      }
    });

    this.eventSource.onerror = () => {
      this.ngZone.run(() => this.connected.set(false));
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected.set(false);
  }

  dismiss(id: number): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
