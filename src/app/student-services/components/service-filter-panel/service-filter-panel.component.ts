import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ServiceCategory } from '../../models/student-service.model';

@Component({
  standalone: false,
  selector: 'app-service-filter-panel',
  templateUrl: './service-filter-panel.component.html',
})
export class ServiceFilterPanelComponent {
  @Input({ required: true }) filtersForm!: FormGroup;
  @Input() categories: ServiceCategory[] = [];
  @Output() readonly resetClicked = new EventEmitter<void>();

  reset(): void {
    this.resetClicked.emit();
  }
}

