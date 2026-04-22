import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/report.model';

import { UserService } from '../../../../user-security/services/user.service';

@Component({
  selector: 'app-furniture-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './furniture-report.component.html',
  styleUrls: ['./furniture-report.component.scss']
})
export class FurnitureReportComponent implements OnInit {
  furnitureId: number = 0;
  loading = false;
  submitted = false;
  error?: string;

  reasons = [
    'Annonce frauduleuse',
    'Prix abusif',
    'Article endommage non declare',
    'Informations incorrectes',
    'Contenu inapproprie',
    'Autre'
  ];

  newReport: Report = {
    furnitureId: 0,
    reporterId: 0,
    reason: '',
    description: ''
  };

  constructor(
    private reportService: ReportService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get currentUserId(): number {
    const user = this.userService.currentUser();
    return user ? Number(user.id) : 0;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.furnitureId = Number(params.get('id'));
      this.newReport.furnitureId = this.furnitureId;
      this.newReport.reporterId = this.currentUserId;
    });
  }

  saveReportLocally(): void {
    const existing = JSON.parse(localStorage.getItem('furniture_reports') || '[]');
    const entry = {
      id: Date.now(),
      furnitureId: this.furnitureId,
      furnitureTitle: `Article #${this.furnitureId}`,
      sellerId: 0,
      reason: this.newReport.reason,
      description: this.newReport.description,
      reportedBy: this.newReport.reporterId || 1,
      date: new Date().toISOString()
    };
    existing.push(entry);
    localStorage.setItem('furniture_reports', JSON.stringify(existing));
  }

  submitReport(): void {
    if (!this.newReport.reason) {
      this.error = 'Veuillez choisir une raison.';
      return;
    }
    this.loading = true;
    this.saveReportLocally();
    this.reportService.create(this.newReport).subscribe({
      next: () => {
        this.submitted = true;
        this.error = undefined;
        this.newReport.reason = '';
        this.newReport.description = '';
        this.loading = false;
      },
      error: () => {
        this.submitted = true;
        this.error = undefined;
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/real-estate/furniture']);
  }
}