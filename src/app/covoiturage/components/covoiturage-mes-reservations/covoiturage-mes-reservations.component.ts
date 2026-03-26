import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { Reservation, Covoiturage } from '../../models/covoiturage.model';

@Component({
  selector: 'app-covoiturage-mes-reservations',
  templateUrl: './covoiturage-mes-reservations.component.html',
  styleUrls: ['./covoiturage-mes-reservations.component.scss']
})
export class CovoiturageMesReservationsComponent implements OnInit {

  reservations: Reservation[] = [];
  covoituragesMap: Map<number, Covoiturage> = new Map();
  loading = false;
  currentUserId: number = 0;

  // Confirm modal
  showConfirmModal = false;
  pendingDeleteId: number | null = null;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId'));
    this.loadMesReservations();
  }

  loadMesReservations(): void {
    this.loading = true;
    this.covoiturageService.getReservationsByPassenger(this.currentUserId).subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
        // Load covoiturage details for each reservation
        const uniqueIds = [...new Set(data.map(r => r.covoiturageId))];
        uniqueIds.forEach(id => {
          this.covoiturageService.getCovoiturageById(id).subscribe({
            next: (c) => this.covoituragesMap.set(id, c),
            error: () => {}
          });
        });
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  getCovoiturage(id: number): Covoiturage | undefined {
    return this.covoituragesMap.get(id);
  }

  cancelReservation(id: number): void {
    this.pendingDeleteId = id;
    this.showConfirmModal = true;
  }

  onConfirmCancel(): void {
    if (this.pendingDeleteId === null) return;
    this.covoiturageService.deleteReservation(this.pendingDeleteId).subscribe({
      next: () => this.loadMesReservations(),
      error: (err) => console.error(err)
    });
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDeleteId = null;
  }

  viewTrajet(covoiturageId: number): void {
    this.router.navigate(['/covoiturage/detail', covoiturageId]);
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmee';
      case 'REFUSEE': return 'Refusee';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'bg-warning text-dark';
      case 'CONFIRMEE': return 'bg-success';
      case 'REFUSEE': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
