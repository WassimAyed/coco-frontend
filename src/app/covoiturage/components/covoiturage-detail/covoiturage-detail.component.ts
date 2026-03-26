import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { Covoiturage, Reservation, Vehicule, StatusReservation } from '../../models/covoiturage.model';

@Component({
  selector: 'app-covoiturage-detail',
  templateUrl: './covoiturage-detail.component.html',
  styleUrls: ['./covoiturage-detail.component.css']
})
export class CovoiturageDetailComponent implements OnInit {

  covoiturage: Covoiturage | null = null;
  vehicule: Vehicule | null = null;
  reservations: Reservation[] = [];
  loading = true;
  error = '';

  currentUserId: number = 0;
  isDriver = false;
  nbPassengers: number = 1;
  reservationSuccess = '';
  reservationError = '';

  StatusReservation = StatusReservation;

  // Reservation existante du user
  myReservation: Reservation | null = null;
  loadingMyReservation = false;

  // Confirm modal
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalIcon = '';
  confirmModalAction: (() => void) | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private covoiturageService: CovoiturageService
  ) {}

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId'));
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadCovoiturage(id);
    }
  }

  loadCovoiturage(id: number): void {
    this.loading = true;
    this.covoiturageService.getCovoiturageById(id).subscribe({
      next: (data) => {
        this.covoiturage = data;
        this.isDriver = data.idDriver === this.currentUserId;
        this.loading = false;

        if (data.vehicleId) {
          this.loadVehicule(data.vehicleId);
        }
        if (this.isDriver) {
          this.loadReservations(id);
        } else {
          this.loadMyReservation(id);
        }
      },
      error: (err) => {
        this.error = 'Impossible de charger ce trajet.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadVehicule(vehicleId: number): void {
    this.covoiturageService.getVehiculeById(vehicleId).subscribe({
      next: (v) => this.vehicule = v,
      error: (err) => console.error('Erreur chargement vehicule', err)
    });
  }

  loadReservations(covoiturageId: number): void {
    this.covoiturageService.getReservationsByCovoiturage(covoiturageId).subscribe({
      next: (res) => this.reservations = res,
      error: (err) => console.error('Erreur chargement reservations', err)
    });
  }

  loadMyReservation(covoiturageId: number): void {
    this.loadingMyReservation = true;
    this.covoiturageService.getReservationsByPassenger(this.currentUserId).subscribe({
      next: (allRes) => {
        const found = allRes.find(r => r.covoiturageId === covoiturageId);
        this.myReservation = found || null;
        if (found) {
          this.nbPassengers = found.nbPassengers;
        }
        this.loadingMyReservation = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingMyReservation = false;
      }
    });
  }

  // Nouvelle reservation
  reserver(): void {
    if (!this.covoiturage) return;
    this.reservationError = '';
    this.reservationSuccess = '';

    if (this.nbPassengers < 1 || this.nbPassengers > this.covoiturage.placesDisponibles) {
      this.reservationError = `Nombre de passagers invalide (max ${this.covoiturage.placesDisponibles}).`;
      return;
    }

    const reservation: Reservation = {
      idPassenger: this.currentUserId,
      nbPassengers: this.nbPassengers,
      covoiturageId: this.covoiturage.id!,
      statusReservation: StatusReservation.EN_ATTENTE
    };

    this.covoiturageService.addReservation(reservation).subscribe({
      next: () => {
        this.reservationSuccess = 'Reservation envoyee avec succes !';
        this.loadCovoiturage(this.covoiturage!.id!);
      },
      error: (err) => {
        this.reservationError = 'Erreur lors de la reservation.';
        console.error(err);
      }
    });
  }

  // Modifier reservation existante (EN_ATTENTE uniquement)
  modifierReservation(): void {
    if (!this.myReservation || !this.covoiturage) return;
    this.reservationError = '';
    this.reservationSuccess = '';

    if (this.nbPassengers < 1 || this.nbPassengers > this.covoiturage.placesDisponibles) {
      this.reservationError = `Nombre de passagers invalide (max ${this.covoiturage.placesDisponibles}).`;
      return;
    }

    const updated: Reservation = {
      ...this.myReservation,
      nbPassengers: this.nbPassengers
    };

    this.covoiturageService.updateReservation(updated).subscribe({
      next: () => {
        this.reservationSuccess = 'Reservation modifiee avec succes !';
        this.loadCovoiturage(this.covoiturage!.id!);
      },
      error: (err) => {
        this.reservationError = 'Erreur lors de la modification.';
        console.error(err);
      }
    });
  }

  // Annuler reservation (EN_ATTENTE uniquement)
  annulerReservation(): void {
    if (!this.myReservation) return;
    this.openConfirmModal(
      'Annuler la reservation',
      'Voulez-vous vraiment annuler votre reservation ?',
      'fas fa-times-circle text-danger',
      () => {
        this.covoiturageService.deleteReservation(this.myReservation!.id!).subscribe({
          next: () => {
            this.reservationSuccess = 'Reservation annulee.';
            this.myReservation = null;
            this.nbPassengers = 1;
            this.loadCovoiturage(this.covoiturage!.id!);
          },
          error: (err) => {
            this.reservationError = 'Erreur lors de l\'annulation.';
            console.error(err);
          }
        });
      }
    );
  }

  updateReservationStatus(reservation: Reservation, status: StatusReservation): void {
    const action$ = status === StatusReservation.CONFIRMEE
      ? this.covoiturageService.accepterReservation(reservation.id!)
      : this.covoiturageService.refuserReservation(reservation.id!);

    action$.subscribe({
      next: () => {
        this.loadReservations(this.covoiturage!.id!);
        this.loadCovoiturage(this.covoiturage!.id!);
      },
      error: (err) => console.error('Erreur mise a jour reservation', err)
    });
  }

  deleteCovoiturage(): void {
    if (!this.covoiturage?.id) return;
    this.openConfirmModal(
      'Supprimer le trajet',
      'Voulez-vous vraiment supprimer ce trajet ?',
      'fas fa-trash-alt text-danger',
      () => {
        this.covoiturageService.deleteCovoiturage(this.covoiturage!.id!).subscribe({
          next: () => this.router.navigate(['/covoiturage/list']),
          error: (err) => console.error('Erreur suppression', err)
        });
      }
    );
  }

  openConfirmModal(title: string, message: string, icon: string, action: () => void): void {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalIcon = icon;
    this.confirmModalAction = action;
    this.showConfirmModal = true;
  }

  onConfirm(): void {
    if (this.confirmModalAction) {
      this.confirmModalAction();
    }
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmModalAction = null;
  }

  getVehiculeImageUrl(filename: string): string {
    return this.covoiturageService.getVehiculeImageUrl(filename);
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
}
