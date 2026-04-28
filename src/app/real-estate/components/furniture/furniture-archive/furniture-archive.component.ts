import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Archive, RotateCcw, Box, CheckCircle, AlertTriangle, ChevronLeft, Search, Database } from 'lucide-angular';

@Component({
  selector: 'app-furniture-archive',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './furniture-archive.component.html',
  styleUrls: ['./furniture-archive.component.scss']
})
export class FurnitureArchiveComponent implements OnInit {
  readonly ArchiveIcon = Archive;
  readonly RestoreIcon = RotateCcw;
  readonly BoxIcon = Box;
  readonly SuccessIcon = CheckCircle;
  readonly AlertIcon = AlertTriangle;
  readonly BackIcon = ChevronLeft;
  readonly SearchIcon = Search;
  readonly DataIcon = Database;
  archivedItems: any[] = [];
  loading = false;
  success?: string;
  error?: string;
  archiveResult?: { message: string; archivedCount: number };

  private baseUrl = 'http://localhost:8099/api/archive';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadArchived();
  }

  loadArchived(): void {
    this.loading = true;
    this.http.get<any[]>(this.baseUrl).subscribe({
      next: (data) => { this.archivedItems = data; this.loading = false; },
      error: () => { this.error = 'Erreur chargement.'; this.loading = false; }
    });
  }

  runArchive(): void {
    this.loading = true;
    this.success = undefined;
    this.error = undefined;
    this.http.post<any>(`${this.baseUrl}/run`, {}).subscribe({
      next: (res) => {
        this.archiveResult = res;
        this.success = `✅ ${res.archivedCount} article(s) archivé(s) !`;
        this.loading = false;
        this.loadArchived();
      },
      error: () => { this.error = 'Erreur archivage.'; this.loading = false; }
    });
  }

  restore(id: number): void {
    this.http.put<any>(`${this.baseUrl}/${id}/restore`, {}).subscribe({
      next: () => {
        this.success = '✅ Article restauré !';
        this.loadArchived();
      },
      error: () => this.error = 'Erreur restauration.'
    });
  }
}
