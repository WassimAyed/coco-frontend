import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  ServiceModerationStatus,
  StudentService,
} from '../../../student-services/models/student-service.model';

@Component({
  standalone: true,
  selector: 'app-admin-services-panel',
  templateUrl: './admin-services-panel.component.html',
  imports: [CommonModule, FormsModule, LucideAngularModule],
})
export class AdminServicesPanelComponent {
  @Input() currentFilter: ServiceModerationStatus | 'all' = 'all';
  @Input() isLoading = false;
  @Input() services: StudentService[] = [];

  @Output() approve = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() filterChanged = new EventEmitter<ServiceModerationStatus | 'all'>();
  @Output() reject = new EventEmitter<string>();
  @Output() tagsChanged = new EventEmitter<{
    serviceId: string;
    tags: string[];
  }>();

  private readonly tagDrafts = new Map<string, string>();

  moderationBadgeClass(status: ServiceModerationStatus): string {
    switch (status) {
      case 'approved':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'pending':
      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
  }

  moderationLabel(status: ServiceModerationStatus): string {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  }

  tagDraft(service: StudentService): string {
    return this.tagDrafts.get(service.id) ?? service.tags.join(', ');
  }

  updateTagDraft(serviceId: string, event: Event): void {
    this.tagDrafts.set(serviceId, (event.target as HTMLInputElement).value);
  }

  saveTags(service: StudentService): void {
    const tags = this.tagDraft(service)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.tagsChanged.emit({
      serviceId: service.id,
      tags,
    });
  }
}

