import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/report.model';

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
    reporterId: 1,
    reason: '',
    description: ''
  };

  constructor(
    private reportService: ReportService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.furnitureId = Number(params.get('id'));
      this.newReport.furnitureId = this.furnitureId;
    });
  }

  submitReport(): void {
    if (!this.newReport.reason) {
      this.error = 'Veuillez choisir une raison.';
      return;
    }
    this.loading = true;
    this.reportService.create(this.newReport).subscribe({
      next: () => {
        this.submitted = true;
        this.error = undefined;
        this.newReport.reason = '';
        this.newReport.description = '';
        this.loading = false;
      },
      error: () => {
        this.error = "Erreur lors de l'envoi du signalement.";
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/furniture']);
  }
}