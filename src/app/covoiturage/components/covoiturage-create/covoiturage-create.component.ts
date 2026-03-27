import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { Covoiturage, Vehicule } from '../../models/covoiturage.model';

declare var google: any;

@Component({
  selector: 'app-covoiturage-create',
  templateUrl: './covoiturage-create.component.html',
  styleUrls: ['./covoiturage-create.component.scss']
})
export class CovoiturageCreateComponent implements OnInit, AfterViewInit, OnDestroy {

  covoiturage: Covoiturage = {
    pointDepart: '',
    pointArrivee: '',
    dateDepart: '',
    nombrePlaces: 1,
    placesDisponibles: 1,
    prixParPassager: 0,
    distance: 0,
    dureeEstimee: 0,
    idDriver: 0,
    vehicleId: 0,
    lattitudeDepart: 0,
    longitudeDepart: 0,
    latitudeArrivee: 0,
    longitudeArrivee: 0
  };

  vehicules: Vehicule[] = [];
  error = '';
  currentUserId: number = 0;

  // Confirm modal
  showConfirmModal = false;
  pendingDeleteVehiculeId: number | null = null;

  // Vehicule modal
  showVehiculeModal = false;
  vehiculeForm: Vehicule = this.emptyVehicule();
  vehiculeError = '';
  vehiculeLoading = false;
  isEditMode = false;
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  // Google Maps
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('departInput', { static: false }) departInput!: ElementRef;
  @ViewChild('arriveeInput', { static: false }) arriveeInput!: ElementRef;
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
    this.covoiturage.idDriver = this.currentUserId;
    this.loadVehicules();
  }

  ngAfterViewInit(): void {
    this.googleMapsLoader.load().then(() => this.initMap());
  }

  ngOnDestroy(): void {
    // Google Maps cleans up automatically
  }

  initMap(): void {
    // Center on Tunisia
    const tunisiaCenter = { lat: 34.0, lng: 9.0 };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 7,
      center: tunisiaCenter,
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
    const departAutocomplete = new google.maps.places.Autocomplete(this.departInput.nativeElement, {
      types: ['geocode', 'establishment']
    });
    departAutocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = departAutocomplete.getPlace();
        if (!place.geometry) return;

        this.covoiturage.pointDepart = place.formatted_address || place.name;
        this.covoiturage.lattitudeDepart = place.geometry.location.lat();
        this.covoiturage.longitudeDepart = place.geometry.location.lng();
        this.updateMapAndRoute();
      });
    });

    // Setup autocomplete for arrival
    const arriveeAutocomplete = new google.maps.places.Autocomplete(this.arriveeInput.nativeElement, {
      types: ['geocode', 'establishment']
    });
    arriveeAutocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = arriveeAutocomplete.getPlace();
        if (!place.geometry) return;

        this.covoiturage.pointArrivee = place.formatted_address || place.name;
        this.covoiturage.latitudeArrivee = place.geometry.location.lat();
        this.covoiturage.longitudeArrivee = place.geometry.location.lng();
        this.updateMapAndRoute();
      });
    });
  }

  // ========== MAP & ROUTE ==========

  private updateMapAndRoute(): void {
    // Clear previous markers
    if (this.departMarker) { this.departMarker.setMap(null); this.departMarker = null; }
    if (this.arriveeMarker) { this.arriveeMarker.setMap(null); this.arriveeMarker = null; }
    this.directionsRenderer.setDirections({ routes: [] });

    const hasDepart = this.covoiturage.lattitudeDepart && this.covoiturage.longitudeDepart;
    const hasArrivee = this.covoiturage.latitudeArrivee && this.covoiturage.longitudeArrivee;

    // If both points are set, calculate route
    if (hasDepart && hasArrivee) {
      this.calculateRoute();
    } else if (hasDepart) {
      const pos = { lat: this.covoiturage.lattitudeDepart, lng: this.covoiturage.longitudeDepart };
      this.departMarker = new google.maps.Marker({ position: pos, map: this.map, label: 'A' });
      this.map.setCenter(pos);
      this.map.setZoom(12);
    } else if (hasArrivee) {
      const pos = { lat: this.covoiturage.latitudeArrivee, lng: this.covoiturage.longitudeArrivee };
      this.arriveeMarker = new google.maps.Marker({ position: pos, map: this.map, label: 'B' });
      this.map.setCenter(pos);
      this.map.setZoom(12);
    }
  }

  private calculateRoute(): void {
    const request = {
      origin: { lat: this.covoiturage.lattitudeDepart, lng: this.covoiturage.longitudeDepart },
      destination: { lat: this.covoiturage.latitudeArrivee, lng: this.covoiturage.longitudeArrivee },
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsService.route(request, (result: any, status: any) => {
      this.ngZone.run(() => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.directionsRenderer.setDirections(result);

          const leg = result.routes[0].legs[0];
          // distance in km, duration in minutes
          this.covoiturage.distance = Math.round(leg.distance.value / 1000);
          this.covoiturage.dureeEstimee = Math.round(leg.duration.value / 60);
        } else {
          console.error('Directions request failed:', status);
        }
      });
    });
  }

  // ========== EXISTING METHODS ==========

  loadVehicules(): void {
    this.covoiturageService.getVehiculesByUtilisateur(this.currentUserId).subscribe({
      next: (data) => {
        this.vehicules = data;
        if (data.length > 0) {
          this.covoiturage.vehicleId = data[0].id!;
        }
      },
      error: (err) => console.error('Erreur chargement vehicules', err)
    });
  }

  onNombrePlacesChange(): void {
    this.covoiturage.placesDisponibles = this.covoiturage.nombrePlaces;
  }

  submit(): void {
    this.error = '';

    if (!this.covoiturage.pointDepart || !this.covoiturage.pointArrivee || !this.covoiturage.dateDepart) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (!this.covoiturage.lattitudeDepart || !this.covoiturage.latitudeArrivee) {
      this.error = 'Veuillez selectionner les points de depart et d\'arrivee depuis les suggestions.';
      return;
    }

    if (!this.covoiturage.vehicleId || this.covoiturage.vehicleId === 0) {
      this.error = 'Veuillez ajouter ou selectionner un vehicule.';
      return;
    }

    this.covoiturage.placesDisponibles = this.covoiturage.nombrePlaces;

    this.covoiturageService.addCovoiturage(this.covoiturage).subscribe({
      next: () => this.router.navigate(['/covoiturage/list']),
      error: (err) => {
        this.error = 'Erreur lors de la creation du trajet.';
        console.error(err);
      }
    });
  }

  // ========== VEHICULE MODAL ==========

  emptyVehicule(): Vehicule {
    return {
      idUtilisateur: 0,
      marque: '',
      immatriculation: '',
      couleur: '',
      capacite: 4,
      image: ''
    };
  }

  openAddVehicule(): void {
    this.vehiculeForm = this.emptyVehicule();
    this.vehiculeForm.idUtilisateur = this.currentUserId;
    this.vehiculeError = '';
    this.isEditMode = false;
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.showVehiculeModal = true;
  }

  openEditVehicule(v: Vehicule): void {
    this.vehiculeForm = { ...v };
    this.vehiculeError = '';
    this.isEditMode = true;
    this.selectedImageFile = null;
    this.imagePreview = v.image ? this.covoiturageService.getVehiculeImageUrl(v.image) : null;
    this.showVehiculeModal = true;
  }

  closeVehiculeModal(): void {
    this.showVehiculeModal = false;
    this.vehiculeError = '';
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  submitVehicule(): void {
    this.vehiculeError = '';

    if (!this.vehiculeForm.marque || !this.vehiculeForm.immatriculation || !this.vehiculeForm.couleur) {
      this.vehiculeError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.vehiculeLoading = true;

    const imageFile = this.selectedImageFile || undefined;

    if (this.isEditMode) {
      this.covoiturageService.updateVehicule(this.vehiculeForm, imageFile).subscribe({
        next: () => {
          this.vehiculeLoading = false;
          this.closeVehiculeModal();
          this.loadVehicules();
        },
        error: (err) => {
          this.vehiculeError = 'Erreur lors de la modification.';
          this.vehiculeLoading = false;
          console.error(err);
        }
      });
    } else {
      this.vehiculeForm.idUtilisateur = this.currentUserId;
      this.covoiturageService.addVehicule(this.vehiculeForm, imageFile).subscribe({
        next: (created) => {
          this.vehiculeLoading = false;
          this.closeVehiculeModal();
          this.loadVehicules();
        },
        error: (err) => {
          this.vehiculeError = 'Erreur lors de l\'ajout.';
          this.vehiculeLoading = false;
          console.error(err);
        }
      });
    }
  }

  deleteVehicule(id: number): void {
    this.pendingDeleteVehiculeId = id;
    this.showConfirmModal = true;
  }

  onConfirmDeleteVehicule(): void {
    if (this.pendingDeleteVehiculeId === null) return;
    const id = this.pendingDeleteVehiculeId;
    this.covoiturageService.deleteVehicule(id).subscribe({
      next: () => {
        this.loadVehicules();
        if (this.covoiturage.vehicleId === id) {
          this.covoiturage.vehicleId = 0;
        }
      },
      error: (err) => console.error(err)
    });
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDeleteVehiculeId = null;
  }

  getImageUrl(filename: string): string {
    return this.covoiturageService.getVehiculeImageUrl(filename);
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }
}
