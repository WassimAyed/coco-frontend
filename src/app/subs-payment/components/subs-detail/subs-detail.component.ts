import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubsService } from '../../services/subs.service';

@Component({
  standalone: false,
  selector: 'app-subs-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subs-detail.component.html',
  styleUrl: './subs-detail.component.scss'
})
export class SubsDetailComponent implements OnInit {
  quota: any;
  userId!: number;

  constructor(private subsService: SubsService, private router: Router) { }

  ngOnInit(): void {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      console.warn('User not logged in, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }
    this.userId = Number(storedId);
    this.loadQuota();
  }

  loadQuota(): void {
    this.subsService.getUserQuota(this.userId).subscribe({
      next: (data) => this.quota = data,
      error: (err) => console.error('Quota error', err)
    });
  }

  getProgressBarWidth(): string {
    if (!this.quota || this.quota.remaining_posts === null) return '100%';
    return (this.quota.remaining_posts / 5 * 100) + '%';
  }
}

