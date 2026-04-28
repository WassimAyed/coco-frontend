import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, ShieldCheck, ShoppingCart, Zap } from 'lucide-angular';
import { FurnitureService } from '../../../services/furniture.service';
import { CartService } from '../../../services/cart.service';
import { CloudinaryService } from '../../../../shared/services/cloudinary.service';
import { UserService } from '../../../../user-security/services/user.service';
import { Furniture } from '../../../models/furniture';
import { ProductRecommendationsComponent } from '../../../../shared/components/product-recommendations/product-recommendations.component';

@Component({
  selector: 'app-furniture-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductRecommendationsComponent, LucideAngularModule],
  providers: [],
  templateUrl: './furniture-detail.component.html',
  styleUrls: ['./furniture-detail.component.scss'],
})
export class FurnitureDetailComponent implements OnInit {
  item?: Furniture;
  displayPrice = 0;
  loading = false;
  error?: string;
  similarItems: Furniture[] = [];
  viewCount = 0;
  sellerName = '';
  selectedQty = 1;

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
    private http: HttpClient,
    private userService: UserService,
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
    this.incrementViews(id);
    this.service.getById(id).subscribe({
      next: (f) => {
        this.item = f;
        this.displayPrice = f.price;
        this.loading = false;
        this.loadSimilar(id);
        this.loadSellerName(f.sellerId);
      },
      error: () => {
        this.error = 'Erreur de chargement du meuble.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/real-estate/furniture']), 2000);
      }
    });
  }

  incrementViews(id: number): void {
    const key = `furniture_views_${id}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    this.viewCount = current + 1;
    localStorage.setItem(key, String(this.viewCount));
  }

  loadSellerName(sellerId?: number): void {
    if (!sellerId) { this.sellerName = 'Vendeur anonyme'; return; }
    // Utilise UserService (cache + environment.apiBaseUrl)
    this.userService.getProfileByUserId(sellerId).subscribe({
      next: (u: any) => {
        if (u) {
          this.sellerName = u.firstName && u.lastName
            ? `${u.firstName} ${u.lastName}`.trim()
            : u.username || u.name || `Vendeur #${sellerId}`;
        } else {
          this.sellerName = `Vendeur #${sellerId}`;
        }
      },
      error: () => { this.sellerName = `Vendeur #${sellerId}`; }
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
    const qty = Math.max(1, Math.min(this.selectedQty || 1, this.item.quantity || 1));
    const added = this.cartService.addItem({
      furnitureId: this.item.id!,
      furnitureTitle: this.item.title,
      price: this.displayPrice,
      quantity: qty
    });
    if (added) {
      this.cartError.set(`\u2705 ${qty}x "${this.item.title}" ajouté au panier !`);
    } else {
      this.cartError.set('\u26A0\uFE0F Cet article est déjà dans votre panier !');
    }
    setTimeout(() => this.cartError.set(null), 3000);
  }

  exportToPdf(): void {
    if (!this.item) return;
    const f = this.item;
    const imgTag = (f.imageUrl && !f.imageUrl.startsWith('data:'))
      ? `<img src="${f.imageUrl}" style="max-width:300px;border-radius:8px;margin-bottom:1rem" /><br/>`
      : '';
    const html = `
      <html><head><title>${f.title}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 2rem; color: #111; max-width: 700px; margin: 0 auto; }
        h1 { color: #8B0000; font-size: 1.8rem; margin-bottom: 0.5rem; }
        .badge { display:inline-block; background:#8B0000; color:#fff; padding:4px 12px; border-radius:20px; font-size:0.85rem; margin-right:6px; }
        .price { font-size:2rem; font-weight:900; color:#8B0000; margin:1rem 0; }
        table { width:100%; border-collapse:collapse; margin-top:1rem; }
        td { padding: 0.6rem 0.8rem; border-bottom: 1px solid #eee; }
        td:first-child { font-weight:700; color:#555; width:35%; }
        footer { margin-top:2rem; color:#999; font-size:0.8rem; text-align:center; }
      </style></head><body>
      ${imgTag}
      <h1>${f.title}</h1>
      <span class="badge">${f.category}</span>
      <span class="badge">${f.condition}</span>
      <div class="price">${f.price} DT</div>
      <table>
        <tr><td>Description</td><td>${f.description || '—'}</td></tr>
        <tr><td>Quantité</td><td>${f.quantity || 1}</td></tr>
        <tr><td>Statut</td><td>${f.status}</td></tr>
        <tr><td>Vendeur</td><td>${this.sellerName}</td></tr>
        <tr><td>Date</td><td>${new Date().toLocaleDateString('fr-FR')}</td></tr>
      </table>
      <footer>CoCo PI_DEV ESPRIT — Marketplace Meubles Etudiants</footer>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
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
