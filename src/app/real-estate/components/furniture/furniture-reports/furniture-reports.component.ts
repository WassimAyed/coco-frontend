import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, AlertTriangle, ShieldCheck, Clock, FileText, ChevronLeft, Eye, MessageSquare, BadgeCheck } from 'lucide-angular';

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
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './furniture-reports.component.html',
  styleUrls: ['./furniture-reports.component.scss']
})
export class FurnitureReportsComponent implements OnInit {
  readonly AlertIcon = AlertTriangle;
  readonly ShieldIcon = ShieldCheck;
  readonly ClockIcon = Clock;
  readonly FileIcon = FileText;
  readonly BackIcon = ChevronLeft;
  readonly ViewIcon = Eye;
  readonly MsgIcon = MessageSquare;
  readonly ResolvedIcon = BadgeCheck;
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
    this.http.get<Report[]>('http://localhost:8099/api/reports').subscribe({
      next: (data) => { this.reports.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filtered(): Report[] {
    const f = this.filter();
    if (f === 'ALL') return this.reports();
    return this.reports().filter(r => r.status === f);
  }

  pendingCount(): number {
    return this.reports().filter(r => r.status === 'PENDING').length;
  }

  resolvedCount(): number {
    return this.reports().filter(r => r.status === 'RESOLVED' || r.status === 'REVIEWED').length;
  }

  getStatusClass(status: string): string {
    return { 'PENDING': 'status-pending', 'REVIEWED': 'status-reviewed', 'RESOLVED': 'status-resolved' }[status] ?? '';
  }

  getReasonLabel(reason: string): string {
    return this.reasonLabels[reason] ?? reason;
  }
}
