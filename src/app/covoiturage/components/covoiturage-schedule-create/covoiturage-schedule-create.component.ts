import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { CovoiturageSchedule, Vehicule } from '../../models/covoiturage.model';

declare var google: any;

@Component({
  selector: 'app-covoiturage-schedule-create',
  templateUrl: './covoiturage-schedule-create.component.html',
  styleUrls: ['./covoiturage-schedule-create.component.scss']
})
export class CovoiturageScheduleCreateComponent implements OnInit, AfterViewInit {

  schedule: CovoiturageSchedule = {
    pointDepart: '',
    pointArrivee: '',
    nombrePlaces: 1,
    lattitudeDepart: 0,
    longitudeDepart: 0,
    latitudeArrivee: 0,
    longitudeArrivee: 0,
    prixParPassager: 0,
    distance: 0,
    dureeEstimee: 0,
    idDriver: 0,
    vehicleId: 0,
    frequency: 'DAILY',
    daysOfWeek: '',
    heureDepart: '08:00',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    active: true
  };

  readonly allDays: { code: string; label: string }[] = [
    { code: 'MON', label: 'Lun' },
    { code: 'TUE', label: 'Mar' },
    { code: 'WED', label: 'Mer' },
    { code: 'THU', label: 'Jeu' },
    { code: 'FRI', label: 'Ven' },
    { code: 'SAT', label: 'Sam' },
    { code: 'SUN', label: 'Dim' }
  ];
  selectedDays: Set<string> = new Set();

  vehicules: Vehicule[] = [];
  currentUserId = 0;
  error = '';
  fieldErrors: Record<string, string> = {};
  submitting = false;
  editMode = false;
  editId: number | null = null;

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('departInput', { static: false }) departInput!: ElementRef;
  @ViewChild('arriveeInput', { static: false }) arriveeInput!: ElementRef;
  private map: any;
  private directionsService: any;
  private directionsRenderer: any;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private googleMapsLoader: GoogleMapsLoaderService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.covoiturageService.getCurrentUserId();
    this.schedule.idDriver = this.currentUserId;

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.editId = Number(idParam);
    }

    this.covoiturageService.getVehiculesByUtilisateur(this.currentUserId).subscribe({
      next: (data) => {
        this.vehicules = data;
        if (!this.editMode && data.length > 0) this.schedule.vehicleId = data[0].id!;
      },
      error: (err) => console.error('Erreur chargement vehicules', err)
    });

    if (this.editMode && this.editId) {
      this.covoiturageService.getScheduleById(this.editId).subscribe({
        next: (data) => {
          this.schedule = { ...data };
          if (this.schedule.daysOfWeek) {
            this.selectedDays = new Set(this.schedule.daysOfWeek.split(',').map(d => d.trim()));
          }
          if (this.departInput?.nativeElement) {
            this.departInput.nativeElement.value = this.schedule.pointDepart || '';
          }
          if (this.arriveeInput?.nativeElement) {
            this.arriveeInput.nativeElement.value = this.schedule.pointArrivee || '';
          }
          this.calculateRouteIfReady();
        },
        error: (err) => {
          console.error('Erreur chargement programmation', err);
          this.error = 'Impossible de charger la programmation.';
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.googleMapsLoader.load().then(() => this.initMap());
  }

  initMap(): void {
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
      polylineOptions: { strokeColor: '#dc3545', strokeWeight: 5 }
    });

    const departAuto = new google.maps.places.Autocomplete(this.departInput.nativeElement, {
      types: ['geocode', 'establishment']
    });
    departAuto.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const p = departAuto.getPlace();
        if (!p.geometry) return;
        this.schedule.pointDepart = p.formatted_address || p.name;
        this.schedule.lattitudeDepart = p.geometry.location.lat();
        this.schedule.longitudeDepart = p.geometry.location.lng();
        this.calculateRouteIfReady();
      });
    });

    const arriveeAuto = new google.maps.places.Autocomplete(this.arriveeInput.nativeElement, {
      types: ['geocode', 'establishment']
    });
    arriveeAuto.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const p = arriveeAuto.getPlace();
        if (!p.geometry) return;
        this.schedule.pointArrivee = p.formatted_address || p.name;
        this.schedule.latitudeArrivee = p.geometry.location.lat();
        this.schedule.longitudeArrivee = p.geometry.location.lng();
        this.calculateRouteIfReady();
      });
    });

    if (this.editMode) {
      if (this.departInput?.nativeElement && this.schedule.pointDepart) {
        this.departInput.nativeElement.value = this.schedule.pointDepart;
      }
      if (this.arriveeInput?.nativeElement && this.schedule.pointArrivee) {
        this.arriveeInput.nativeElement.value = this.schedule.pointArrivee;
      }
      this.calculateRouteIfReady();
    }
  }

  private calculateRouteIfReady(): void {
    if (!this.directionsService || !this.directionsRenderer) return;
    if (!this.schedule.lattitudeDepart || !this.schedule.latitudeArrivee) return;
    const request = {
      origin: { lat: this.schedule.lattitudeDepart, lng: this.schedule.longitudeDepart },
      destination: { lat: this.schedule.latitudeArrivee, lng: this.schedule.longitudeArrivee },
      travelMode: google.maps.TravelMode.DRIVING
    };
    this.directionsService.route(request, (result: any, status: any) => {
      this.ngZone.run(() => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.directionsRenderer.setDirections(result);
          const leg = result.routes[0].legs[0];
          this.schedule.distance = Math.round(leg.distance.value / 1000);
          this.schedule.dureeEstimee = Math.round(leg.duration.value / 60);
        }
      });
    });
  }

  toggleDay(code: string): void {
    if (this.selectedDays.has(code)) this.selectedDays.delete(code);
    else this.selectedDays.add(code);
  }

  isDaySelected(code: string): boolean {
    return this.selectedDays.has(code);
  }

  submit(): void {
    this.error = '';
    this.fieldErrors = {};

    const errors: Record<string, string> = {};

    if (!this.schedule.pointDepart?.trim()) errors['pointDepart'] = 'Le point de depart est obligatoire.';
    if (!this.schedule.pointArrivee?.trim()) errors['pointArrivee'] = 'Le point d\'arrivee est obligatoire.';
    if (!this.schedule.lattitudeDepart || !this.schedule.latitudeArrivee) {
      errors['points'] = 'Veuillez selectionner les points depuis les suggestions.';
    }

    if (!this.schedule.vehicleId || this.schedule.vehicleId === 0) {
      errors['vehicleId'] = 'Veuillez selectionner un vehicule.';
    }

    if (!this.schedule.nombrePlaces || this.schedule.nombrePlaces < 1) {
      errors['nombrePlaces'] = 'Le nombre de places doit etre au minimum 1.';
    } else if (this.schedule.nombrePlaces > 4) {
      errors['nombrePlaces'] = 'Le nombre de places ne peut pas depasser 4.';
    }

    if (this.schedule.prixParPassager == null || this.schedule.prixParPassager < 0) {
      errors['prixParPassager'] = 'Le prix doit etre positif ou nul.';
    } else if (this.schedule.prixParPassager > 1000) {
      errors['prixParPassager'] = 'Le prix est trop eleve.';
    }

    if (!this.schedule.frequency) {
      errors['frequency'] = 'La frequence est obligatoire.';
    }

    if (!this.schedule.heureDepart) {
      errors['heureDepart'] = 'L\'heure de depart est obligatoire.';
    }

    if (this.schedule.frequency === 'WEEKLY' && this.selectedDays.size === 0) {
      errors['daysOfWeek'] = 'Veuillez selectionner au moins un jour de la semaine.';
    }

    if (this.schedule.startDate && this.schedule.endDate &&
        new Date(this.schedule.endDate) < new Date(this.schedule.startDate)) {
      errors['endDate'] = 'La date de fin doit etre apres la date de debut.';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors = errors;
      this.error = 'Veuillez corriger les erreurs ci-dessous.';
      return;
    }

    this.schedule.daysOfWeek = this.schedule.frequency === 'WEEKLY'
      ? Array.from(this.selectedDays).join(',')
      : '';

    this.submitting = true;
    const request$ = this.editMode
      ? this.covoiturageService.updateSchedule(this.schedule)
      : this.covoiturageService.addSchedule(this.schedule);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/covoiturage/mes-schedules']);
      },
      error: (err) => {
        this.submitting = false;
        const body = err?.error;
        if (body?.errors && typeof body.errors === 'object') {
          this.fieldErrors = body.errors;
          this.error = body.message || 'Donnees invalides.';
        } else {
          this.error = body?.message || (this.editMode
            ? 'Erreur lors de la modification de la programmation.'
            : 'Erreur lors de la creation de la programmation.');
        }
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }
}
