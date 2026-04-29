import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Image as ImageIcon, LucideAngularModule, Search, TriangleAlert } from 'lucide-angular';
import { AdminSignal } from '../../models/admin-signal.model';

@Component({
  standalone: true,
  selector: 'app-admin-signals-panel',
  templateUrl: './admin-signals-panel.component.html',
  imports: [CommonModule, LucideAngularModule],
})
export class AdminSignalsPanelComponent {
  @Input() errorMessage: string | null = null;
  @Input() isLoading = false;
  @Input() signals: AdminSignal[] = [];

  readonly AlertTriangleIcon = TriangleAlert;
  readonly ImageIcon = ImageIcon;
  readonly SearchIcon = Search;

  searchTerm = '';

  get filteredSignals(): AdminSignal[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.signals;
    }

    return this.signals.filter((signal) =>
      `${signal.username} ${signal.description} ${signal.userId}`
        .toLowerCase()
        .includes(query),
    );
  }
}

