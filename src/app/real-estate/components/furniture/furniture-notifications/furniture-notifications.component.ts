import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Bell, Check, X, Tag, Star, AlertTriangle, Eye, Trash2 } from 'lucide-angular';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification.model';
import { ReplacePipe } from '../../../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-furniture-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ReplacePipe],
  templateUrl: './furniture-notifications.component.html',
  styleUrls: ['./furniture-notifications.component.scss']
})
export class FurnitureNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  userId = 1;

  readonly Bell = Bell;
  readonly Check = Check;
  readonly X = X;
  readonly Tag = Tag;
  readonly Star = Star;
  readonly AlertTriangle = AlertTriangle;
  readonly Eye = Eye;
  readonly Trash2 = Trash2;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getByUser(this.userId).subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter(n => !n.isRead).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  markAsRead(id?: number): void {
    if (!id) return;
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.loadNotifications()
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead(this.userId).subscribe({
      next: () => this.loadNotifications()
    });
  }

  delete(id?: number): void {
    if (!id) return;
    this.notificationService.delete(id).subscribe({
      next: () => this.loadNotifications()
    });
  }

  getTypeIcon(type: string): any {
    switch (type) {
      case 'OFFER_ACCEPTED': return this.Check;
      case 'OFFER_REJECTED': return this.X;
      case 'NEW_OFFER':      return this.Tag;
      case 'NEW_REVIEW':     return this.Star;
      case 'NEW_REPORT':     return this.AlertTriangle;
      default:               return this.Bell;
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'OFFER_ACCEPTED': return 'type-accepted';
      case 'OFFER_REJECTED': return 'type-rejected';
      case 'NEW_OFFER': return 'type-offer';
      case 'NEW_REVIEW': return 'type-review';
      case 'NEW_REPORT': return 'type-report';
      default: return 'type-default';
    }
  }
}
