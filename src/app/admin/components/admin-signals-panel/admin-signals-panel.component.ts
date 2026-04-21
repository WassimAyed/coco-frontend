import { Component, Input } from '@angular/core';
import { AlertTriangle, Image as ImageIcon, Search } from 'lucide-angular';
import { AdminSignal } from '../../models/admin-signal.model';

@Component({
  standalone: false,
  selector: 'app-admin-signals-panel',
  templateUrl: './admin-signals-panel.component.html',
})
export class AdminSignalsPanelComponent {
  @Input() errorMessage: string | null = null;
  @Input() isLoading = false;
  @Input() signals: AdminSignal[] = [];

  readonly AlertTriangleIcon = AlertTriangle;
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

