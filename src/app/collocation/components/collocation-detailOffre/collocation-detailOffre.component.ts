import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

// -------- Leaflet icon fix --------
const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = iconDefault;
// ---------------------------------

@Component({
  selector: 'app-collocation-detail',
  templateUrl: './collocation-detailOffre.component.html',
  styleUrls: ['./collocation-detailOffre.component.css']
})
export class CollocationDetailComponent implements OnInit, OnDestroy {

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  offer: CollocationOffer | null = null;
  loading = true;
  error = '';

  private map?: L.Map;
  private subs: Subscription[] = [];

  selectedImageIndex = 0;

  contactForm!: ReturnType<FormBuilder['group']>;

  // ✅ ADD THESE PROPERTIES (VERY IMPORTANT)
  ownerId!: number;
  ownerEmail!: string;
  ownerName!: string;
  ownerAvatar!: string;

  constructor(
    private route: ActivatedRoute,
    private collocationService: CollocationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]],
      message: ['', [Validators.required]]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadOffer(+id);
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.map) this.map.remove();
  }

  private loadOffer(id: number): void {
    this.loading = true;

    this.collocationService.getOfferById(id).subscribe({
      next: (data) => {
        this.offer = data;
        this.loading = false;

        // ✅ Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

        this.ownerId = currentUser.id;
        this.ownerEmail = currentUser.email;
        this.ownerName = currentUser.firstName + ' ' + currentUser.lastName;
        this.ownerAvatar = currentUser.avatarUrl;

        // Map logic
        this.cdr.detectChanges();

        if (data.latitude && data.longitude) {
          setTimeout(() => {
            this.initMap(data.latitude!, data.longitude!);
          }, 100);
        }
      },
      error: () => {
        this.error = 'Impossible de charger l’offre.';
        this.loading = false;
      }
    });
  }

  private initMap(lat: number, lng: number): void {
    if (!this.mapContainer) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(this.offer?.titre || 'Colocation')
      .openPopup();

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }
}
