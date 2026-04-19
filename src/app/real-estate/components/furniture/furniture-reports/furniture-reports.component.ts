import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Report {
  id: number;
  furnitureId: number;
  userId: number;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-furniture-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './furniture-reports.component.html',
  styleUrls: ['./furniture-reports.component.scss']
})
export class FurnitureReportsComponent implements OnInit {
  reports = signal<Report[]>([]);
  loading = signal(true);
  filter = signal<string>('ALL');

  readonly filters = ['ALL', 'PENDING', 'REVIEWED', 'RESOLVED'];

  readonly reasonLabels: Record<string, string> = {
    'SPAM': '🚫 Spam',
    'FAKE': '🎭 Fausse annonce',
    'INAPPROPRIATE': '⚠️ Contenu inapproprié',
    'WRONG_PRICE': '💸 Prix incorrect',
    'OTHER': '📝 Autre',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Report[]>('http://localhost:8094/api/reports').subscribe({
      next: (data) => { this.reports.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filtered(): Report[] {
    const f = this.filter();
    if (f === 'ALL') return this.reports();
    return this.reports().filter(r => r.status === f);
  }

  getStatusClass(status: string): string {
    return { 'PENDING': 'status-pending', 'REVIEWED': 'status-reviewed', 'RESOLVED': 'status-resolved' }[status] ?? '';
  }

  getReasonLabel(reason: string): string {
    return this.reasonLabels[reason] ?? reason;
  }
}
