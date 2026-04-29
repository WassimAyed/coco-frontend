import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { Covoiturage, Reservation, Vehicule, StatusReservation, Notation, CO2Impact } from '../../models/covoiturage.model';
import { UserService } from '../../../user-security/services/user.service';

declare var google: any;

@Component({
  standalone: false,
  selector: 'app-covoiturage-detail',
  templateUrl: './covoiturage-detail.component.html',
  styleUrls: ['./covoiturage-detail.component.css']
})
export class CovoiturageDetailComponent implements OnInit {

  covoiturage: Covoiturage | null = null;
  vehicule: Vehicule | null = null;
  co2Impact: CO2Impact | null = null;
  similarCovoiturages: Covoiturage[] = [];
  similarDriverNames: Map<number, string> = new Map();
  reservations: Reservation[] = [];
  passengerNames: Map<number, string> = new Map();
  loading = true;
  error = '';

  currentUserId: number = 0;
  isDriver = false;
  nbPassengers: number = 1;
  reservationSuccess = '';
  reservationError = '';

  StatusReservation = StatusReservation;

  myReservation: Reservation | null = null;
  loadingMyReservation = false;

  // Notation
  notations: Notation[] = [];
  notationDonneurNames: Map<number, string> = new Map();
  myNotation: Notation | null = null;
  newNotation: number = 5;
  newComment: string = '';
  notationSuccess = '';
  notationError = '';
  editingNotation = false;
  hoverRating: number = 0;

  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalIcon = '';
  confirmModalAction: (() => void) | null = null;

  // Google Map
  @ViewChild('detailMapContainer', { static: false }) mapContainer!: ElementRef;
  private map: any;
  private mapReady = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private covoiturageService: CovoiturageService,
    private ngZone: NgZone,
    private googleMapsLoader: GoogleMapsLoaderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.covoiturageService.getCurrentUserId();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadCovoiturage(id);
    }
  }

  private initMap(): void {
    if (this.mapReady || !this.mapContainer) return;

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 7,
      center: { lat: 34.0, lng: 9.0 },
      mapTypeControl: false,
      streetViewControl: false
    });

    this.mapReady = true;
  }

  private showRouteOnMap(): void {
    if (!this.covoiturage) return;
    if (!this.covoiturage.lattitudeDepart || !this.covoiturage.latitudeArrivee) return;

    // Load Google Maps then init
    this.googleMapsLoader.load().then(() => {
    setTimeout(() => {
      this.initMap();
      if (!this.map) return;

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: false,
        polylineOptions: { strokeColor: '#dc3545', strokeWeight: 5 }
      });

      const request = {
        origin: { lat: this.covoiturage!.lattitudeDepart, lng: this.covoiturage!.longitudeDepart },
        destination: { lat: this.covoiturage!.latitudeArrivee, lng: this.covoiturage!.longitudeArrivee },
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result: any, status: any) => {
        this.ngZone.run(() => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          } else {
            console.error('Directions request failed:', status);
          }
        });
      });
    }, 100);
    });
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

        this.loadNotations(data.idDriver);
        this.showRouteOnMap();
        this.loadSimilarCovoiturages(data);
        this.loadCO2Impact(id);
      },
      error: (err) => {
        this.error = 'Impossible de charger ce trajet.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadCO2Impact(covoiturageId: number): void {
    this.covoiturageService.getCO2Impact(covoiturageId).subscribe({
      next: (impact) => this.co2Impact = impact,
      error: (err) => console.error('Erreur chargement impact CO2', err)
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
      next: (res) => {
        this.reservations = res;
        this.loadPassengerNames(res);
      },
      error: (err) => console.error('Erreur chargement reservations', err)
    });
  }

  private loadPassengerNames(reservations: Reservation[]): void {
    const uniqueIds = [...new Set(reservations.map(r => r.idPassenger))]
      .filter(id => !!id && !this.passengerNames.has(id));
    uniqueIds.forEach(id => {
      this.userService.getProfileByUserId(id).subscribe({
        next: (profile: any) => this.passengerNames.set(id, this.formatUserName(profile, id)),
        error: () => this.passengerNames.set(id, `Utilisateur #${id}`)
      });
    });
  }

  private formatUserName(profile: any, fallbackId: number): string {
    if (!profile) return `Utilisateur #${fallbackId}`;
    const first = profile.firstName || '';
    const last = profile.lastName || profile.lastname || '';
    const full = `${first} ${last}`.trim();
    return full || profile.username || `Utilisateur #${fallbackId}`;
  }

  getPassengerName(id: number): string {
    return this.passengerNames.get(id) || 'Chargement...';
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

  // ========== TRAJETS SIMILAIRES ==========

  loadSimilarCovoiturages(current: Covoiturage): void {
    if (!current.id) return;
    this.covoiturageService.getSimilarCovoiturages(current.id, 4).subscribe({
      next: (similar) => {
        this.similarCovoiturages = similar || [];
        this.loadSimilarDriverNames(this.similarCovoiturages);
      },
      error: (err) => console.error('Erreur chargement trajets similaires', err)
    });
  }

  private loadSimilarDriverNames(trajets: Covoiturage[]): void {
    const uniqueIds = [...new Set(trajets.map((t) => t.idDriver))];
    uniqueIds.forEach((id) => {
      if (!this.similarDriverNames.has(id)) {
        this.covoiturageService.getUserById(id).subscribe({
          next: (user) => this.similarDriverNames.set(id, user.username),
          error: () => this.similarDriverNames.set(id, `Utilisateur #${id}`)
        });
      }
    });
  }

  getSimilarDriverName(id: number): string {
    return this.similarDriverNames.get(id) || 'Chargement...';
  }

  goToSimilarTrajet(id: number | undefined): void {
    if (!id) return;
    this.router.navigate(['/covoiturage/detail', id]).then(() => {
      this.loadCovoiturage(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== NOTATION ==========

  loadNotations(idDriver: number): void {
    this.covoiturageService.getNotationsByRecepteur(idDriver).subscribe({
      next: (notations) => {
        this.notations = notations;
        this.myNotation = notations.find(n => n.idDonneur === this.currentUserId) || null;
        if (this.myNotation) {
          this.newNotation = this.myNotation.notation;
          this.newComment = this.myNotation.comment;
        }
        this.loadDonneurNames(notations);
      },
      error: (err) => console.error('Erreur chargement notations', err)
    });
  }

  private loadDonneurNames(notations: Notation[]): void {
    const uniqueIds = [...new Set(notations.map(n => n.idDonneur))];
    uniqueIds.forEach(id => {
      if (!this.notationDonneurNames.has(id)) {
        this.covoiturageService.getUserById(id).subscribe({
          next: (user) => this.notationDonneurNames.set(id, user.username),
          error: () => this.notationDonneurNames.set(id, `Utilisateur #${id}`)
        });
      }
    });
  }

  getDonneurName(id: number): string {
    return this.notationDonneurNames.get(id) || 'Chargement...';
  }

  getAverageNotation(): number {
    if (this.notations.length === 0) return 0;
    const sum = this.notations.reduce((acc, n) => acc + n.notation, 0);
    return Math.round((sum / this.notations.length) * 10) / 10;
  }

  submitNotation(): void {
    if (!this.covoiturage) return;
    this.notationError = '';
    this.notationSuccess = '';

    const notation: Notation = {
      notation: this.newNotation,
      comment: this.newComment,
      idDonneur: this.currentUserId,
      idRecepteur: this.covoiturage.idDriver
    };

    this.covoiturageService.addNotation(notation).subscribe({
      next: () => {
        this.notationSuccess = 'Notation ajoutee avec succes !';
        this.loadNotations(this.covoiturage!.idDriver);
      },
      error: (err) => {
        this.notationError = 'Erreur lors de l\'ajout de la notation.';
        console.error(err);
      }
    });
  }

  updateMyNotation(): void {
    if (!this.myNotation) return;
    this.notationError = '';
    this.notationSuccess = '';

    const updated: Notation = {
      ...this.myNotation,
      notation: this.newNotation,
      comment: this.newComment
    };

    this.covoiturageService.updateNotation(updated).subscribe({
      next: () => {
        this.notationSuccess = 'Notation modifiee avec succes !';
        this.editingNotation = false;
        this.loadNotations(this.covoiturage!.idDriver);
      },
      error: (err) => {
        this.notationError = 'Erreur lors de la modification.';
        console.error(err);
      }
    });
  }

  deleteMyNotation(): void {
    if (!this.myNotation) return;
    this.openConfirmModal(
      'Supprimer la notation',
      'Voulez-vous vraiment supprimer votre notation ?',
      'fas fa-star text-warning',
      () => {
        this.covoiturageService.deleteNotation(this.myNotation!.id!).subscribe({
          next: () => {
            this.notationSuccess = 'Notation supprimee.';
            this.myNotation = null;
            this.newNotation = 5;
            this.newComment = '';
            this.editingNotation = false;
            this.loadNotations(this.covoiturage!.idDriver);
          },
          error: (err) => {
            this.notationError = 'Erreur lors de la suppression.';
            console.error(err);
          }
        });
      }
    );
  }

  setRating(value: number): void {
    this.newNotation = value;
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

