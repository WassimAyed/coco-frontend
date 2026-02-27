import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubsService } from '../../services/subs.service';

@Component({
  selector: 'app-subs-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subs-detail.component.html',
  styleUrl: './subs-detail.component.scss'
})
export class SubsDetailComponent implements OnInit {
  quota: any;
  userId = 1;

  constructor(private subsService: SubsService) { }

  ngOnInit(): void {
    this.loadQuota();
  }

  loadQuota(): void {
    this.subsService.getUserQuota(this.userId).subscribe({
      next: (data) => this.quota = data,
      error: (err) => console.error('Erreur quota', err)
    });
  }

  getProgressBarWidth(): string {
    if (!this.quota || this.quota.remaining_posts === null) return '100%';
    // On assume 5 posts max pour le plan FREE pour la demo visuelle
    return (this.quota.remaining_posts / 5 * 100) + '%';
  }
}
