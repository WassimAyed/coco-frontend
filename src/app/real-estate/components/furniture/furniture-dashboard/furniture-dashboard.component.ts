import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsService } from '../../../services/stats.service';
import { Stats } from '../../../models/stats.model';

@Component({
  selector: 'app-furniture-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './furniture-dashboard.component.html',
  styleUrls: ['./furniture-dashboard.component.scss']
})
export class FurnitureDashboardComponent implements OnInit {
  stats?: Stats;
  loading = true;
  error?: string;

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.error = 'Erreur lors du chargement.'; this.loading = false; }
    });
  }

  getCategories(): string[] {
    return this.stats ? Object.keys(this.stats.countByCategory) : [];
  }

  getConditions(): string[] {
    return this.stats ? Object.keys(this.stats.countByCondition) : [];
  }

  getBarWidth(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  getMaxCategoryCount(): number {
    if (!this.stats) return 1;
    return Math.max(...Object.values(this.stats.countByCategory));
  }
}
