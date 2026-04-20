import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldCheck, ShoppingCart, Zap } from 'lucide-angular';
import { FurnitureService } from '../../../services/furniture.service';
import { CartService } from '../../../services/cart.service';
import { CloudinaryService } from '../../../../shared/services/cloudinary.service';
import { Furniture } from '../../../models/furniture';
import { ProductRecommendationsComponent } from '../../../../shared/components/product-recommendations/product-recommendations.component';

@Component({
  selector: 'app-furniture-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductRecommendationsComponent, LucideAngularModule],
  templateUrl: './furniture-detail.component.html',
  styleUrls: ['./furniture-detail.component.scss'],
})
export class FurnitureDetailComponent implements OnInit {
  item?: Furniture;
  displayPrice = 0;
  loading = false;
  error?: string;
  similarItems: Furniture[] = [];

  readonly cartError = signal<string | null>(null);
  readonly showOfferForm = signal(false);
  readonly offerPrice = signal('');
  readonly offerMessage = signal('');
  readonly offerSubmitted = signal(false);
  readonly offerError = signal('');

  readonly ShieldCheck = ShieldCheck;
  readonly ShoppingCart = ShoppingCart;
  readonly Zap = Zap;

  constructor(
    private route: ActivatedRoute,
    private service: FurnitureService,
    private router: Router,
    private cartService: CartService,
    private cloudinary: CloudinaryService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const id = Number(idParam);
        if (!isNaN(id) && id > 0) {
          this.load(id);
        } else {
          this.error = 'ID de meuble invalide';
          setTimeout(() => this.router.navigate(['/real-estate/furniture']), 2000);
        }
      } else {
        this.error = 'Aucun ID fourni';
        setTimeout(() => this.router.navigate(['/real-estate/furniture']), 2000);
      }
    });
  }

  load(id: number): void {
    this.loading = true;
    this.error = undefined;
    this.service.getById(id).subscribe({
      next: (f) => {
        this.item = f;
        this.displayPrice = f.price;
        this.loading = false;
        this.loadSimilar(id);
      },
      error: () => {
        this.error = 'Erreur de chargement du meuble.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/real-estate/furniture']), 2000);
      }
    });
  }

  loadSimilar(id: number): void {
    this.service.getSimilar(id).subscribe({
      next: (items) => {
        this.similarItems = items.filter(f => f.id !== id).slice(0, 4);
      },
      error: () => {
        this.service.getAll().subscribe({
          next: (all) => {
            this.similarItems = all
              .filter(f => f.id !== id && f.category === this.item?.category && f.status === 'AVAILABLE')
              .slice(0, 4);
          }
        });
      }
    });
  }

  getItemImage(): string {
    if (!this.item) return '';
    const url = this.item.imageUrl || this.item.imageBase64;
    if (!url) return '';
    if (url.startsWith('https://res.cloudinary.com')) {
      return this.cloudinary.getOptimizedUrl(url, 600, 380);
    }
    return url;
  }

  getSimilarImage(f: Furniture): string {
    const url = f.imageUrl || f.imageBase64;
    if (!url) return 'https://placehold.co/280x180/f5f5f5/999?text=No+Image';
    if (url.startsWith('https://res.cloudinary.com')) {
      return this.cloudinary.getOptimizedUrl(url, 280, 180);
    }
    return url;
  }

  addToCart(): void {
    if (!this.item) return;
    const added = this.cartService.addItem({
      furnitureId: this.item.id!,
      furnitureTitle: this.item.title,
      price: this.displayPrice,
      quantity: 1
    });
    if (added) {
      this.cartError.set('\u2705 Article ajoute au panier !');
    } else {
      this.cartError.set('\u26A0\uFE0F Cet article est deja dans votre panier !');
    }
    setTimeout(() => this.cartError.set(null), 3000);
  }

  openOfferForm(): void {
    this.showOfferForm.set(true);
    this.offerSubmitted.set(false);
    this.offerError.set('');
    this.offerPrice.set('');
    this.offerMessage.set('');
  }

  closeOfferForm(): void {
    this.showOfferForm.set(false);
  }

  submitOffer(): void {
    const price = Number(this.offerPrice());
    if (!price || price <= 0) {
      this.offerError.set('Veuillez saisir un prix valide.');
      return;
    }
    this.offerError.set('');
    setTimeout(() => {
      this.offerSubmitted.set(true);
    }, 800);
  }
}
