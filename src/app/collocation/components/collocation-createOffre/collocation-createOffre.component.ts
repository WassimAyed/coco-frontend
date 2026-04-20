import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollocationService } from '../../services/collocation.service';
import { SmartCollocationService } from '../../services/smart-collocation.service';
import * as L from 'leaflet';
import { UserService } from '../../../user-security/services/user.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

//  http://localhost:4200/collocation/create-offre

// Fix marker icons
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

@Component({
  standalone: false,
  selector: 'app-collocation-create-offre',
  templateUrl: './collocation-createOffre.component.html',
  styleUrls: ['./collocation-createOffre.component.css']
})
export class CollocationCreateOffreComponent implements AfterViewInit, OnDestroy {



  @ViewChild('mapContainer') mapContainer!: ElementRef;

  offerForm: FormGroup;
  selectedFiles: File[] = [];
  private fileUrls: Map<File, string> = new Map(); // cache blob URLs

  selectedImageIndices: Set<number> = new Set();
  allSelected: boolean = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  
  predictedPrice: string = '';
  isPredictingPrice: boolean = false;

  // Allowed image types
  allowedImageTypes = ['image/jpeg', 'image/png'];
  typeWarning = ''; // to show messages about skipped files

  tunisianVilles: string[] = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
    'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba',
    'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana',
    'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  private map!: L.Map;
  private marker!: L.Marker;
  private readonly defaultCenter: L.LatLngTuple = [36.8065, 10.1815]; // Tunis


    private readonly userService = inject(UserService);
    readonly user = computed(() => this.userService.currentUser());



  constructor(
    private fb: FormBuilder,
    private collocationService: CollocationService,
    private smartCollocationService: SmartCollocationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {



    this.offerForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      prixLoc: [null, [Validators.required, Validators.min(0)]],
      ville: ['', Validators.required],
      chambres: [null, [Validators.required, Validators.min(1)]],
      meublee: [false],
      latitude: [null],
      longitude: [null]
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.setupPricePrediction();
  }

  isNumeric(val: any): boolean {
    return val != null && val !== '' && !isNaN(Number(val));
  }

  setupPricePrediction() {
    this.offerForm.valueChanges.pipe(
      debounceTime(800)
    ).subscribe(val => {
      if (val.ville && val.chambres) {
        this.isPredictingPrice = true;
        this.smartCollocationService.predictPrice({
          ville: val.ville,
          chambres: val.chambres,
          meublee: val.meublee || false
        }).subscribe({
          next: res => {
            this.predictedPrice = res.recommended_price;
            this.isPredictingPrice = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isPredictingPrice = false;
          }
        })
      } else {
        this.predictedPrice = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
    this.fileUrls.forEach(url => URL.revokeObjectURL(url));
    this.fileUrls.clear();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView(this.defaultCenter, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.marker = L.marker(this.defaultCenter, { draggable: true }).addTo(this.map);

    this.marker.on('moveend', (e: any) => {
      const latLng = e.target.getLatLng();
      this.offerForm.patchValue({ latitude: latLng.lat, longitude: latLng.lng });
      this.cdr.detectChanges();
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.offerForm.patchValue({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      this.cdr.detectChanges();
    });

    this.offerForm.patchValue({ latitude: this.defaultCenter[0], longitude: this.defaultCenter[1] });
    this.cdr.detectChanges();
  }

  onFileChange(event: any): void {
    this.typeWarning = ''; // clear previous warning

    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files) as File[];
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      newFiles.forEach(file => {
        if (this.allowedImageTypes.includes(file.type)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });

      if (invalidFiles.length > 0) {
        this.typeWarning = `Les fichiers suivants ne sont pas au format JPG/PNG et ont été ignorés : ${invalidFiles.join(', ')}`;
      }

      if (validFiles.length > 0) {
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        validFiles.forEach(file => {
          if (!this.fileUrls.has(file)) {
            this.fileUrls.set(file, URL.createObjectURL(file));
          }
        });
      }

      event.target.value = '';
      this.cdr.detectChanges();
    }
  }

  getImageUrl(file: File): string {
    let url = this.fileUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.fileUrls.set(file, url);
    }
    return url;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  truncateFileName(filename: string, maxLength: number = 15): string {
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength) + '...';
  }

  toggleImageSelection(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.selectedImageIndices.has(index)) {
      this.selectedImageIndices.delete(index);
    } else {
      this.selectedImageIndices.add(index);
    }
    this.allSelected = this.selectedImageIndices.size === this.selectedFiles.length;
  }

  selectAllImages(): void {
    if (this.allSelected) {
      this.selectedImageIndices.clear();
    } else {
      this.selectedImageIndices = new Set(Array.from({ length: this.selectedFiles.length }, (_, i) => i));
    }
    this.allSelected = !this.allSelected;
  }

  isImageSelected(index: number): boolean {
    return this.selectedImageIndices.has(index);
  }

  hasSelectedImages(): boolean {
    return this.selectedImageIndices.size > 0;
  }

  getSelectedCount(): number {
    return this.selectedImageIndices.size;
  }

  deleteImage(index: number, event?: Event): void {
    if (event) event.stopPropagation();

    const file = this.selectedFiles[index];
    const url = this.fileUrls.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      this.fileUrls.delete(file);
    }

    this.selectedFiles.splice(index, 1);

    const newSelectedIndices = new Set<number>();
    this.selectedImageIndices.forEach(idx => {
      if (idx > index) newSelectedIndices.add(idx - 1);
      else if (idx < index) newSelectedIndices.add(idx);
    });
    this.selectedImageIndices = newSelectedIndices;
    this.allSelected = this.selectedImageIndices.size === this.selectedFiles.length && this.selectedFiles.length > 0;
    this.cdr.detectChanges();
  }

  deleteSelectedImages(): void {
    if (!this.hasSelectedImages()) return;
    const indicesToDelete = Array.from(this.selectedImageIndices).sort((a, b) => b - a);
    indicesToDelete.forEach(index => {
      const file = this.selectedFiles[index];
      const url = this.fileUrls.get(file);
      if (url) {
        URL.revokeObjectURL(url);
        this.fileUrls.delete(file);
      }
    });
    indicesToDelete.forEach(index => this.selectedFiles.splice(index, 1));
    this.selectedImageIndices.clear();
    this.allSelected = false;
    this.cdr.detectChanges();
  }

  clearAllImages(): void {
    this.fileUrls.forEach(url => URL.revokeObjectURL(url));
    this.fileUrls.clear();
    this.selectedFiles = [];
    this.selectedImageIndices.clear();
    this.allSelected = false;
    this.cdr.detectChanges();
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.offerForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      this.offerForm.markAllAsTouched();
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please select at least one image';
      return;
    }

    // Size validation
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = this.selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      this.errorMessage = `Some images exceed 5MB limit: ${oversizedFiles.map(f => this.truncateFileName(f.name, 10)).join(', ')}`;
      return;
    }

    // Type validation (double‑check)
    const invalidTypeFiles = this.selectedFiles.filter(f => !this.allowedImageTypes.includes(f.type));
    if (invalidTypeFiles.length > 0) {
      this.errorMessage = `Certains fichiers ne sont pas au format JPG/PNG : ${invalidTypeFiles.map(f => this.truncateFileName(f.name, 10)).join(', ')}`;
      return;
    }

    if (!this.offerForm.get('latitude')?.value || !this.offerForm.get('longitude')?.value) {
      this.errorMessage = 'Please select a location on the map';
      return;
    }

    // Format expiry date as YYYY-MM-DD (common for backend)
    const expiryDate = this.calculateExpiryDate().toISOString().split('T')[0];

    const offer = {
      titre: this.offerForm.get('titre')?.value,
      description: this.offerForm.get('description')?.value,
      prixLoc: this.offerForm.get('prixLoc')?.value,
      ville: this.offerForm.get('ville')?.value,
      chambres: this.offerForm.get('chambres')?.value,
      meublee: this.offerForm.get('meublee')?.value,
      latitude: this.offerForm.get('latitude')?.value,
      longitude: this.offerForm.get('longitude')?.value,
      expiryDate: expiryDate
    };

    this.submitting = true;

    // Log the offer being sent (for debugging)
    console.log('Submitting offer:', offer);


    const currentUser = this.user();

if (!currentUser || !currentUser.id) {
  this.errorMessage = 'User not authenticated';
  return;
}

const userId = currentUser.id;

this.collocationService.createOffer(offer, this.selectedFiles, userId).subscribe({
      next: (res: any) => {
        console.log('Offer created:', res);
        this.successMessage = 'Offer created successfully!';
        this.offerForm.reset({ meublee: false, latitude: this.defaultCenter[0], longitude: this.defaultCenter[1] });
        this.clearAllImages();
        this.submitting = false;
        //this.router.navigateByUrl('/collocation/offres');
      },
      error: (err: any) => {
        console.error('Error creating offer:', err);
        // Log the full error response for debugging
        if (err.error) {
          console.error('Error details:', typeof err.error === 'string' ? err.error : JSON.stringify(err.error));
        }
        this.errorMessage = err.error?.message || 'Failed to create offer. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calculateExpiryDate(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry;
  }

  resetForm(): void {
    this.offerForm.reset({ meublee: false, latitude: this.defaultCenter[0], longitude: this.defaultCenter[1] });
    if (this.marker) this.marker.setLatLng(this.defaultCenter);
    this.clearAllImages();
    this.errorMessage = '';
    this.successMessage = '';
    this.typeWarning = '';
    this.cdr.detectChanges();
  }
}

