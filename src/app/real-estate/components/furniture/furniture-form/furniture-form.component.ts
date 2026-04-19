import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, CloudUpload, Check, X } from 'lucide-angular';
import { FurnitureService } from '../../../services/furniture.service';
import { CloudinaryService } from '../../../../shared/services/cloudinary.service';
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

  categories = ['Salon', 'Chambre', 'Cuisine', 'Bureau', 'Meuble'];

  // Wizard
  steps = ['Infos', 'Détails', 'Photo', 'Récap'];
  currentStep = 0;

  conditionOptions = [
    { value: 'GOOD', icon: '✅', label: 'Bon état', desc: 'Très peu utilisé' },
    { value: 'FAIR', icon: '⚠️', label: 'Passable', desc: 'Quelques traces' },
    { value: 'POOR', icon: '❌', label: 'Mauvais état', desc: 'Très usé' },
  ];

  statusOptions = [
    { value: 'AVAILABLE', icon: '🟢', label: 'Disponible' },
    { value: 'RESERVED',  icon: '🟡', label: 'Réservé' },
    { value: 'SOLD',      icon: '🔴', label: 'Vendu' },
  ];

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      'Salon': '🛋️', 'Chambre': '🛏️', 'Cuisine': '🍳',
      'Bureau': '💼', 'Meuble': '🗄️'
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
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: [this.categories[0], Validators.required],
      condition: ['GOOD', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(0)]],
      status: ['AVAILABLE', Validators.required],
      sellerId: [0, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
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
      'Salon': `Magnifique ${title || 'meuble de salon'} en excellent état. Idéal pour un intérieur chaleureux et moderne. Dimensions adaptées à tous les espaces. ${condition === 'GOOD' ? 'État impeccable, aucune rayure.' : 'Quelques traces d\'usure normales.'}`,
      'Chambre': `${title || 'Meuble de chambre'} pratique et élégant. Offre un rangement optimal et s'intègre parfaitement dans votre espace nuit. ${condition === 'GOOD' ? 'Très bon état général.' : 'Usage normal, toujours fonctionnel.'}`,
      'Cuisine': `${title || 'Équipement cuisine'} fonctionnel et robuste. Parfait pour compléter votre cuisine. Facile à entretenir. ${condition === 'GOOD' ? 'Comme neuf.' : 'En bon état de marche.'}`,
      'Bureau': `${title || 'Meuble de bureau'} ergonomique et stylé. Boostez votre productivité avec ce meuble au design contemporain. ${condition === 'GOOD' ? 'État parfait, jamais endommagé.' : 'Légères traces d\'utilisation.'}`,
      'Meuble': `${title || 'Meuble polyvalent'} de qualité, adapté à tous les espaces. Robuste et esthétique. ${condition === 'GOOD' ? 'Très bonne conservation.' : 'Bon état général.'}`,
    };
    const desc = templates[category] || `${title || 'Article'} de qualité, ${condition === 'GOOD' ? 'en excellent état' : 'en bon état'}. Idéal pour votre intérieur. N'hésitez pas à me contacter pour plus d'informations !`;
    setTimeout(() => {
      this.form.get('description')?.setValue(desc);
      this.aiGenerating = false;
    }, 1200);
  }

  submit(): void {
    if (this.form.invalid) {
      this.error = 'Please fix form errors before submitting.';
      return;
    }
    this.loading = true;
    const payload: Furniture = {
      ...this.form.value,
      imageBase64: this.imageBase64,
      imageUrl: this.cloudinaryUrl,
    };
    if (this.isEdit && this.id) {
      this.service.update(this.id, payload).subscribe({
        next: () => this.router.navigate(['/furniture']),
        error: () => {
          this.error = 'Update failed.';
          this.loading = false;
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => this.router.navigate(['/furniture']),
        error: () => {
          this.error = 'Create failed.';
          this.loading = false;
        },
      });
    }
  }
}