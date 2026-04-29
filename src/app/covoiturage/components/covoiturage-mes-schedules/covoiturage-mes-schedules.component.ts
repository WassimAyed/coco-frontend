import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { CovoiturageSchedule } from '../../models/covoiturage.model';

@Component({
  selector: 'app-covoiturage-mes-schedules',
  templateUrl: './covoiturage-mes-schedules.component.html',
  styleUrls: ['./covoiturage-mes-schedules.component.scss']
})
export class CovoiturageMesSchedulesComponent implements OnInit {

  schedules: CovoiturageSchedule[] = [];
  loading = false;
  error = '';
  currentUserId = 0;
  pendingDeleteId: number | null = null;
  showConfirmModal = false;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.covoiturageService.getCurrentUserId();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.covoiturageService.getSchedulesByDriver(this.currentUserId).subscribe({
      next: (data) => {
        this.schedules = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur de chargement.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  toggle(s: CovoiturageSchedule): void {
    if (!s.id) return;
    this.covoiturageService.toggleSchedule(s.id).subscribe({
      next: (updated) => { s.active = updated.active; },
      error: (err) => console.error(err)
    });
  }

  askDelete(id: number): void {
    this.pendingDeleteId = id;
    this.showConfirmModal = true;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
    this.showConfirmModal = false;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId === null) return;
    const id = this.pendingDeleteId;
    this.covoiturageService.deleteSchedule(id).subscribe({
      next: () => {
        this.schedules = this.schedules.filter(s => s.id !== id);
        this.cancelDelete();
      },
      error: (err) => {
        console.error(err);
        this.cancelDelete();
      }
    });
  }

  runNow(): void {
    this.covoiturageService.runSchedulesNow().subscribe({
      next: (res) => {
        alert(`${res.generated} trajet(s) genere(s).`);
        this.load();
      },
      error: (err) => console.error(err)
    });
  }

  formatDays(daysOfWeek?: string): string {
    if (!daysOfWeek) return '-';
    const map: Record<string, string> = {
      MON: 'Lun', TUE: 'Mar', WED: 'Mer', THU: 'Jeu',
      FRI: 'Ven', SAT: 'Sam', SUN: 'Dim'
    };
    return daysOfWeek.split(',').map(d => map[d.trim()] || d).join(', ');
  }

  goToCreate(): void {
    this.router.navigate(['/covoiturage/schedule/create']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/covoiturage/schedule/edit', id]);
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }
}
