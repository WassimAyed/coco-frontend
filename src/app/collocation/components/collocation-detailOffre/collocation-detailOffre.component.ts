import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import { FormBuilder, Validators } from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations';
import { Subscription } from 'rxjs';

// -------- Leaflet default icon fix --------
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;
// -----------------------------------------

@Component({
  selector: 'app-collocation-detail',
  templateUrl: './collocation-detailOffre.component.html',
  styleUrls: ['./collocation-detailOffre.component.css'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('450ms cubic-bezier(.16,.8,.32,1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query('.glass-card, .title-section, .gallery-main, .description-card', [
          style({ opacity: 0, transform: 'translateY(25px)' }),
          stagger(120, [
            animate('500ms cubic-bezier(.16,.8,.32,1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ])
    ])
  ]
})
export class CollocationDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  offer: CollocationOffer | null = null;
  loading = true;
  error = '';

  private map?: L.Map;
  private subs: Subscription[] = [];

  selectedImageIndex = 0;
  lightboxOpen = false;
  isFavorite = false;
  sendingMessage = false;
  messageSent = false;

  contactForm!: ReturnType<FormBuilder['group']>;

  constructor(
    private route: ActivatedRoute,
    private collocationService: CollocationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadOffer(+id);
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.map) this.map.remove();
  }

 private loadOffer(id: number): void {
  this.loading = true;

  this.collocationService.getOfferById(id).subscribe({
    next: (data) => {
      this.offer = data;
      this.selectedImageIndex = 0;

      // Force Angular to update the DOM immediately
      this.cdr.detectChanges();

      if (data.latitude && data.longitude) {
        // Wait one tick to ensure DOM is ready, then initialize map
        setTimeout(() => this.initMap(data.latitude!, data.longitude!), 0);
      }
      this.loading = false;
    },
    error: () => {
      this.error = 'Impossible de charger l’offre.';
      this.loading = false;
    }
  });
}

  private initMap(lat: number, lng: number): void {
    if (this.map) this.map.remove();

    this.map = L.map('offer-map', {
      zoomControl: true,
      attributionControl: true
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(this.offer?.titre || 'Colocation')
      .openPopup();
  }

  selectImage(index: number): void { this.selectedImageIndex = index; }
  nextImage(): void {
    if (!this.offer?.imagesColoc?.length) return;
    const len = this.offer.imagesColoc.length;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % len;
    this.cdr.markForCheck();
  }
  prevImage(): void {
    if (!this.offer?.imagesColoc?.length) return;
    const len = this.offer.imagesColoc.length;
    this.selectedImageIndex = (this.selectedImageIndex - 1 + len) % len;
    this.cdr.markForCheck();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(e: KeyboardEvent) {
    if (this.lightboxOpen) {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowRight') this.nextImage();
      if (e.key === 'ArrowLeft') this.prevImage();
    }
  }

  openLightbox(index: number) { this.selectedImageIndex = index; this.lightboxOpen = true; }
  closeLightbox(): void { this.lightboxOpen = false; this.subs.forEach(s => s.unsubscribe()); this.subs = []; }

  toggleFavorite(): void { this.isFavorite = !this.isFavorite; }

  async shareOffer() {
    const url = window.location.href;
    const text = this.offer?.titre || 'Annonce';
    if (navigator.share) await navigator.share({ title: text, url });
    else await navigator.clipboard.writeText(url);
  }

  sendMessage(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.sendingMessage = true;

    setTimeout(() => {
      this.sendingMessage = false;
      this.messageSent = true;
      this.contactForm.reset();
      this.cdr.markForCheck();
      setTimeout(() => this.messageSent = false, 3000);
    }, 1200);
  }
}
