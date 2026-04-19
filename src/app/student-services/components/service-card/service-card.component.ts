import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StudentService } from '../../models/student-service.model';

@Component({
  standalone: false,
  selector: 'app-service-card',
  templateUrl: './service-card.component.html',
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: StudentService;
  @Input() categoryClass = 'bg-secondary text-secondary-foreground border-border';
  @Input() categoryLabel = '';
  @Input() detailLink: string[] = [];
  @Input() editLink: string[] = [];
  @Input() contactLink: string[] = ['/profile'];
  @Input() showManageActions = false;
  @Input() showContactAction = true;
  @Output() readonly deleteClicked = new EventEmitter<string>();

  moderationBadgeClass(): string {
    switch (this.service.moderationStatus) {
      case 'approved':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'pending':
      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
  }

  moderationLabel(): string {
    switch (this.service.moderationStatus) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending Review';
    }
  }

  onDelete(): void {
    this.deleteClicked.emit(this.service.id);
  }
}

