import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { Reservation, Covoiturage, StatusReservation } from '../../models/covoiturage.model';

@Component({
  selector: 'app-covoiturage-gestion-reservations',
  templateUrl: './covoiturage-gestion-reservations.component.html',
  styleUrls: ['./covoiturage-gestion-reservations.component.scss']
})
export class CovoiturageGestionReservationsComponent implements OnInit {

  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  covoituragesMap: Map<number, Covoiturage> = new Map();
  passengerNames: Map<number, string> = new Map();
  loading = false;
  currentUserId: number = 0;

  // Filtres
  filterStatus: string = '';
  filterTrajet: number | null = null;
  availableTrajets: Covoiturage[] = [];

  // Action feedback
  actionSuccess = '';
  actionError = '';

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.covoiturageService.getCurrentUserId();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.actionSuccess = '';
    this.actionError = '';

    // Charger les trajets du driver
    this.covoiturageService.getCovoituragesByDriver(this.currentUserId).subscribe({
      next: (trajets) => {
        this.availableTrajets = trajets;
        trajets.forEach(t => this.covoituragesMap.set(t.id!, t));
        this.loadReservations();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadReservations(): void {
    this.covoiturageService.getReservationsByDriver(this.currentUserId).subscribe({
      next: (data) => {
        this.reservations = data;
        this.filteredReservations = data;
        this.loading = false;
        this.loadPassengerNames(data);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  private loadPassengerNames(reservations: Reservation[]): void {
    const uniqueIds = [...new Set(reservations.map(r => r.idPassenger))];
    uniqueIds.forEach(id => {
      if (!this.passengerNames.has(id)) {
        this.covoiturageService.getUserById(id).subscribe({
          next: (user) => this.passengerNames.set(id, user.username),
          error: () => this.passengerNames.set(id, `Utilisateur #${id}`)
        });
      }
    });
  }

  getPassengerName(id: number): string {
    return this.passengerNames.get(id) || 'Chargement...';
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(r => {
      if (this.filterStatus && r.statusReservation !== this.filterStatus) return false;
      if (this.filterTrajet !== null && r.covoiturageId !== this.filterTrajet) return false;
      return true;
    });
  }

  resetFilters(): void {
    this.filterStatus = '';
    this.filterTrajet = null;
    this.filteredReservations = this.reservations;
  }

  accepter(reservation: Reservation): void {
    this.actionSuccess = '';
    this.actionError = '';
    this.covoiturageService.accepterReservation(reservation.id!).subscribe({
      next: () => {
        this.actionSuccess = `Reservation #${reservation.id} acceptee.`;
        this.loadData();
      },
      error: (err) => {
        this.actionError = err.error?.message || err.error || 'Erreur lors de l\'acceptation.';
        console.error(err);
      }
    });
  }

  refuser(reservation: Reservation): void {
    this.actionSuccess = '';
    this.actionError = '';
    this.covoiturageService.refuserReservation(reservation.id!).subscribe({
      next: () => {
        this.actionSuccess = `Reservation #${reservation.id} refusee.`;
        this.loadData();
      },
      error: (err) => {
        this.actionError = err.error?.message || err.error || 'Erreur lors du refus.';
        console.error(err);
      }
    });
  }

  getCovoiturage(id: number): Covoiturage | undefined {
    return this.covoituragesMap.get(id);
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'fas fa-clock';
      case 'CONFIRMEE': return 'fas fa-check-circle';
      case 'REFUSEE': return 'fas fa-times-circle';
      default: return 'fas fa-question-circle';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  get countEnAttente(): number {
    return this.reservations.filter(r => r.statusReservation === 'EN_ATTENTE').length;
  }

  get countConfirmee(): number {
    return this.reservations.filter(r => r.statusReservation === 'CONFIRMEE').length;
  }

  get countRefusee(): number {
    return this.reservations.filter(r => r.statusReservation === 'REFUSEE').length;
  }
}
