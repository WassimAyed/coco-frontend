import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, CloudUpload, Check, X } from 'lucide-angular';
import { FurnitureService } from '../../../services/furniture.service';
import { CloudinaryService } from '../../../../shared/services/cloudinary.service';
import { UserService } from '../../../../user-security/services/user.service';
import { Furniture } from '../../../models/furniture';

@Component({
  selector: 'app-furniture-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],

  templateUrl: './furniture-form.component.html',
  styleUrls: ['./furniture-form.component.scss'],
})
export class FurnitureFormComponent implements OnInit {
  form!: any;
  loading = false;
  error?: string;
  isEdit = false;
  private id?: number;

  imagePreview?: string;
  imageBase64?: string;
  cloudinaryUrl?: string;
  uploadingToCloud = false;

  readonly CloudUpload = CloudUpload;
  readonly Check = Check;
  readonly X = X;

  aiGenerating = false;
  aiError = '';

  categories = ['LIVING_ROOM', 'BEDROOM', 'OFFICE', 'KITCHEN', 'OTHER'];

  // Wizard
  steps = ['Informations', 'Détails', 'Photo', 'Récapitulatif'];
  currentStep = 0;

  conditionOptions = [
    { value: 'NEW', icon: '✨', label: 'Neuf', desc: 'Jamais utilisé' },
    { value: 'GOOD', icon: '✅', label: 'Bon état', desc: 'Très peu utilisé' },
    { value: 'USED', icon: '⚠️', label: 'Usage normal', desc: 'Quelques traces' },
  ];

  statusOptions = [
    { value: 'AVAILABLE', icon: '🟢', label: 'Disponible' },
    { value: 'SOLD',      icon: '🔴', label: 'Vendu' },
    { value: 'ARCHIVED',  icon: '🗂️', label: 'Archivé' },
  ];

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      'LIVING_ROOM': '🛋️', 'BEDROOM': '🛏️', 'KITCHEN': '🍳',
      'OFFICE': '💼', 'OTHER': '📦'
    };
    return icons[cat] || '📦';
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  goToStep(i: number): void {
    if (i < this.currentStep) this.currentStep = i;
  }

  constructor(
    private fb: FormBuilder,
    private service: FurnitureService,
    private route: ActivatedRoute,
    private router: Router,
    private cloudinary: CloudinaryService,
    private userService: UserService,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: [this.categories[0]],
      condition: ['GOOD'],
      price: [0],
      quantity: [1],
      status: ['AVAILABLE'],
      sellerId: [0], // will be patched in ngOnInit
    });
  }

  get currentSellerId(): number {
    const user = this.userService.currentUser();
    return user ? Number(user.id) : 0;
  }

  ngOnInit(): void {
    // Always set the real sellerId from the connected user
    this.form.patchValue({ sellerId: this.currentSellerId });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEdit = true;
        this.id = Number(idParam);
        this.load(this.id);
      }
    });
  }

  load(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (f) => {
        this.form.patchValue(f as any);
        if (f.imageBase64) {
          this.imagePreview = f.imageBase64;
          this.imageBase64 = f.imageBase64;
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load furniture.';
        this.loading = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      this.error = 'Image trop grande. Maximum 2MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.imageBase64 = reader.result as string;
      this.imagePreview = this.imageBase64;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageBase64 = undefined;
    this.imagePreview = undefined;
    this.cloudinaryUrl = undefined;
  }

  openCloudinaryWidget(): void {
    this.uploadingToCloud = true;
    this.cloudinary.uploadWidget((secureUrl: string) => {
      this.cloudinaryUrl = secureUrl;
      this.imagePreview = secureUrl;
      this.imageBase64 = undefined; // prefer Cloudinary URL
      this.uploadingToCloud = false;
    });
    // reset flag if widget is closed without upload after a delay
    setTimeout(() => { this.uploadingToCloud = false; }, 60000);
  }

  generateDescription(): void {
    const title: string = this.form.get('title')?.value || '';
    const category: string = this.form.get('category')?.value || '';
    const condition: string = this.form.get('condition')?.value || '';
    if (!title && !category) {
      this.aiError = 'Remplissez le titre ou la catégorie d\'abord.';
      return;
    }
    this.aiGenerating = true;
    this.aiError = '';
    const templates: Record<string, string> = {
      'LIVING_ROOM': `Magnifique ${title || 'meuble de salon'} en excellent état. Idéal pour un intérieur chaleureux et moderne. Dimensions adaptées à tous les espaces. ${condition === 'GOOD' ? 'État impeccable, aucune rayure.' : 'Quelques traces d\'usure normales.'}`,
      'BEDROOM': `${title || 'Meuble de chambre'} pratique et élégant. Offre un rangement optimal et s'intègre parfaitement dans votre espace nuit. ${condition === 'GOOD' ? 'Très bon état général.' : 'Usage normal, toujours fonctionnel.'}`,
      'KITCHEN': `${title || 'Équipement cuisine'} fonctionnel et robuste. Parfait pour compléter votre cuisine. Facile à entretenir. ${condition === 'GOOD' ? 'Comme neuf.' : 'En bon état de marche.'}`,
      'OFFICE': `${title || 'Meuble de bureau'} ergonomique et stylé. Boostez votre productivité avec ce meuble au design contemporain. ${condition === 'GOOD' ? 'État parfait, jamais endommagé.' : 'Légères traces d\'utilisation.'}`,
      'OTHER': `${title || 'Article polyvalent'} de qualité, adapté à tous les espaces. Robuste et esthétique. ${condition === 'GOOD' ? 'Très bonne conservation.' : 'Bon état général.'}`,
    };
    const desc = templates[category] || `${title || 'Article'} de qualité, ${condition === 'GOOD' ? 'en excellent état' : 'en bon état'}. Idéal pour votre intérieur. N'hésitez pas à me contacter pour plus d'informations !`;
    setTimeout(() => {
      this.form.get('description')?.setValue(desc);
      this.aiGenerating = false;
    }, 1200);
  }

  // --- NOUVELLES FONCTIONNALITÉS IA ---

  /** IA : Suggère une catégorie basée sur le titre */
  suggestCategory(): void {
    const title = this.form.get('title')?.value?.toLowerCase() || '';
    if (!title) {
        this.aiError = 'Entrez un titre pour que l\'IA puisse analyser.';
        return;
    }
    
    this.aiGenerating = true;
    setTimeout(() => {
        let suggested = 'OTHER';
        if (title.includes('lit') || title.includes('matelas') || title.includes('chevet') || title.includes('armoire')) suggested = 'BEDROOM';
        else if (title.includes('canapé') || title.includes('table') || title.includes('tele') || title.includes('salon')) suggested = 'LIVING_ROOM';
        else if (title.includes('bureau') || title.includes('chaise') || title.includes('pc')) suggested = 'OFFICE';
        else if (title.includes('frigo') || title.includes('four') || title.includes('cuisine')) suggested = 'KITCHEN';
        
        this.form.get('category')?.setValue(suggested);
        this.aiGenerating = false;
    }, 800);
  }

  /** IA : Calcule un prix suggéré basé sur la catégorie et l'état */
  getSmartPriceSuggestion(): number {
    const category = this.form.get('category')?.value;
    const condition = this.form.get('condition')?.value;
    
    const basePrices: Record<string, number> = {
        'LIVING_ROOM': 450, 'BEDROOM': 350, 'OFFICE': 200, 'KITCHEN': 300, 'OTHER': 100
    };
    
    let price = basePrices[category] || 100;
    if (condition === 'NEW') price *= 1.2;
    else if (condition === 'USED') price *= 0.7;
    
    return Math.round(price);
  }

  applySmartPrice(): void {
    this.form.get('price')?.setValue(this.getSmartPriceSuggestion());
  }

  submit(): void {
    if (!this.form.get('title')?.value?.trim()) {
      this.error = 'Le titre est obligatoire.';
      return;
    }
    this.loading = true;
    this.error = undefined;
    const defaultImg = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';
    const payload: Furniture = {
      ...this.form.value,
      price: Number(this.form.value.price),
      quantity: Number(this.form.value.quantity),
      sellerId: this.currentSellerId,
      imageBase64: this.imageBase64 || undefined,
      imageUrl: this.cloudinaryUrl || defaultImg,
      status: this.form.value.status || 'AVAILABLE',
    };
    if (this.isEdit && this.id) {
      this.service.update(this.id, payload).subscribe({
        next: () => {
          localStorage.setItem('furniture_success', 'Annonce mise à jour avec succès !');
          this.router.navigate(['/real-estate/furniture']);
        },
        error: (err) => {
          console.error('[Furniture Create/Update Error]', err);
          this.error = err.error?.message || err.message || 'Erreur lors de la communication avec le backend (Port 8099).';
          this.loading = false;
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          localStorage.setItem('furniture_success', 'Annonce publiée avec succès !');
          this.router.navigate(['/real-estate/furniture']);
        },
        error: (err) => {
          console.error('[Furniture Create Error]', err);
          this.error = err.error?.message || err.message || 'Erreur lors de la création de l\'annonce (Port 8099).';
          this.loading = false;
        },
      });
    }
  }
}