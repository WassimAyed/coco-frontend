import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { Covoiturage, Vehicule } from '../../models/covoiturage.model';

declare var google: any;

@Component({
  selector: 'app-covoiturage-mes-trajets',
  templateUrl: './covoiturage-mes-trajets.component.html',
  styleUrls: ['./covoiturage-mes-trajets.component.scss']
})
export class CovoiturageMesTrajetsComponent implements OnInit {

  trajets: Covoiturage[] = [];
  loading = false;
  currentUserId: number = 0;

  // Confirm modal
  showConfirmModal = false;
  confirmMessage = '';
  pendingDeleteId: number | null = null;

  // Edit modal
  showEditModal = false;
  editTrajet: Covoiturage | null = null;
  vehicules: Vehicule[] = [];
  editError = '';
  editLoading = false;

  // Google Maps for edit modal
  @ViewChild('editMapContainer', { static: false }) editMapContainer!: ElementRef;
  @ViewChild('editDepartInput', { static: false }) editDepartInput!: ElementRef;
  @ViewChild('editArriveeInput', { static: false }) editArriveeInput!: ElementRef;
  private map: any;
  private directionsService: any;
  private directionsRenderer: any;
  private departMarker: any;
  private arriveeMarker: any;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router,
    private ngZone: NgZone,
    private googleMapsLoader: GoogleMapsLoaderService
  ) {}

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId'));
    this.loadMesTrajets();
    this.loadVehicules();
  }

  loadMesTrajets(): void {
    this.loading = true;
    this.covoiturageService.getCovoituragesByDriver(this.currentUserId).subscribe({
      next: (data) => { this.trajets = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  loadVehicules(): void {
    this.covoiturageService.getVehiculesByUtilisateur(this.currentUserId).subscribe({
      next: (data) => this.vehicules = data,
      error: (err) => console.error(err)
    });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/covoiturage/detail', id]);
  }

  // ========== EDIT MODAL WITH MAP ==========

  openEditModal(trajet: Covoiturage): void {
    this.editTrajet = { ...trajet };
    this.editError = '';
    this.showEditModal = true;

    // Init map after modal renders
    setTimeout(() => {
      this.googleMapsLoader.load().then(() => this.initEditMap());
    }, 100);
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editTrajet = null;
    this.editError = '';
    this.map = null;
  }

  private initEditMap(): void {
    if (!this.editMapContainer || !this.editTrajet) return;

    const center = this.editTrajet.lattitudeDepart && this.editTrajet.longitudeDepart
      ? { lat: this.editTrajet.lattitudeDepart, lng: this.editTrajet.longitudeDepart }
      : { lat: 34.0, lng: 9.0 };

    this.map = new google.maps.Map(this.editMapContainer.nativeElement, {
      zoom: 7,
      center: center,
      mapTypeControl: false,
      streetViewControl: false
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: '#dc3545', strokeWeight: 5 }
    });

    // Setup autocomplete for departure
    const departAutocomplete = new google.maps.places.Autocomplete(this.editDepartInput.nativeElement, {
      types: ['geocode', 'establishment']
    });
    departAutocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = departAutocomplete.getPlace();
        if (!place.geometry || !this.editTrajet) return;

        this.editTrajet.pointDepart = place.formatted_address || place.name;
        this.editTrajet.lattitudeDepart = place.geometry.location.lat();
        this.editTrajet.longitudeDepart = place.geometry.location.lng();
        this.updateEditMapAndRoute();
      });
    });

    // Setup autocomplete for arrival
    const arriveeAutocomplete = new google.maps.places.Autocomplete(this.editArriveeInput.nativeElement, {
      types: ['geocode', 'establishment']
    });
    arriveeAutocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = arriveeAutocomplete.getPlace();
        if (!place.geometry || !this.editTrajet) return;

        this.editTrajet.pointArrivee = place.formatted_address || place.name;
        this.editTrajet.latitudeArrivee = place.geometry.location.lat();
        this.editTrajet.longitudeArrivee = place.geometry.location.lng();
        this.updateEditMapAndRoute();
      });
    });

    // Show existing route if coordinates exist
    if (this.editTrajet.lattitudeDepart && this.editTrajet.latitudeArrivee) {
      this.updateEditMapAndRoute();
    }
  }

  private updateEditMapAndRoute(): void {
    if (!this.editTrajet || !this.map) return;

    if (this.departMarker) { this.departMarker.setMap(null); this.departMarker = null; }
    if (this.arriveeMarker) { this.arriveeMarker.setMap(null); this.arriveeMarker = null; }
    this.directionsRenderer.setDirections({ routes: [] });

    const hasDepart = this.editTrajet.lattitudeDepart && this.editTrajet.longitudeDepart;
    const hasArrivee = this.editTrajet.latitudeArrivee && this.editTrajet.longitudeArrivee;

    if (hasDepart && hasArrivee) {
      this.calculateEditRoute();
    } else if (hasDepart) {
      const pos = { lat: this.editTrajet.lattitudeDepart, lng: this.editTrajet.longitudeDepart };
      this.departMarker = new google.maps.Marker({ position: pos, map: this.map, label: 'A' });
      this.map.setCenter(pos);
      this.map.setZoom(12);
    } else if (hasArrivee) {
      const pos = { lat: this.editTrajet.latitudeArrivee, lng: this.editTrajet.longitudeArrivee };
      this.arriveeMarker = new google.maps.Marker({ position: pos, map: this.map, label: 'B' });
      this.map.setCenter(pos);
      this.map.setZoom(12);
    }
  }

  private calculateEditRoute(): void {
    if (!this.editTrajet) return;

    const request = {
      origin: { lat: this.editTrajet.lattitudeDepart, lng: this.editTrajet.longitudeDepart },
      destination: { lat: this.editTrajet.latitudeArrivee, lng: this.editTrajet.longitudeArrivee },
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsService.route(request, (result: any, status: any) => {
      this.ngZone.run(() => {
        if (status === google.maps.DirectionsStatus.OK && this.editTrajet) {
          this.directionsRenderer.setDirections(result);

          const leg = result.routes[0].legs[0];
          this.editTrajet.distance = Math.round(leg.distance.value / 1000);
          this.editTrajet.dureeEstimee = Math.round(leg.duration.value / 60);
        } else {
          console.error('Directions request failed:', status);
        }
      });
    });
  }

  onEditNombrePlacesChange(): void {
    if (this.editTrajet) {
      this.editTrajet.placesDisponibles = this.editTrajet.nombrePlaces;
    }
  }

  submitEdit(): void {
    if (!this.editTrajet) return;
    this.editError = '';

    if (!this.editTrajet.pointDepart || !this.editTrajet.pointArrivee || !this.editTrajet.dateDepart) {
      this.editError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.editLoading = true;
    this.covoiturageService.updateCovoiturage(this.editTrajet).subscribe({
      next: () => {
        this.editLoading = false;
        this.closeEditModal();
        this.loadMesTrajets();
      },
      error: (err) => {
        this.editError = 'Erreur lors de la modification du trajet.';
        this.editLoading = false;
        console.error(err);
      }
    });
  }

  // ========== DELETE ==========

  deleteTrajet(id: number): void {
    this.pendingDeleteId = id;
    this.confirmMessage = 'Voulez-vous vraiment supprimer ce trajet ?';
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (this.pendingDeleteId === null) return;
    this.covoiturageService.deleteCovoiturage(this.pendingDeleteId).subscribe({
      next: () => this.loadMesTrajets(),
      error: (err) => console.error(err)
    });
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDeleteId = null;
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
