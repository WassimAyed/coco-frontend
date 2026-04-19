import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldCheck, Bell, ShoppingCart, Zap } from 'lucide-angular';
import { FurnitureService } from '../../../services/furniture.service';
import { NotificationService } from '../../../services/notification.service';
import { CartService } from '../../../services/cart.service';
import { BoostService } from '../../../services/boost.service';
import { CloudinaryService } from '../../../../shared/services/cloudinary.service';
import { Furniture } from '../../../models/furniture';

@Component({
  selector: 'app-furniture-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './furniture-list.component.html',
  styleUrls: ['./furniture-list.component.scss'],
})
export class FurnitureListComponent implements OnInit {
  furnitures: Furniture[] = [];
  filtered: Furniture[] = [];
  favorites: Furniture[] = [];
  unreadCount = 0;
  cartCount = 0;
  boostedIds: number[] = [];
  loading = false;
  error?: string;

  readonly ShieldCheck = ShieldCheck;
  readonly Bell = Bell;
  readonly ShoppingCart = ShoppingCart;
  readonly Zap = Zap;

  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedCondition = '';

  categories = ['Salon', 'Chambre', 'Cuisine', 'Bureau', 'Meuble'];
  statuses = ['AVAILABLE', 'SOLD', 'RESERVED'];
  conditions = ['GOOD', 'FAIR', 'POOR'];

  pageSize = 6;
  currentPage = 1;

  constructor(
    private service: FurnitureService,
    private notificationService: NotificationService,
    private cartService: CartService,
    private boostService: BoostService,
    private cloudinary: CloudinaryService,
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.load();
    this.loadUnreadCount();
    this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getCount();
    });
  }

  checkBoosts(): void {
    this.furnitures.forEach(f => {
      if (!f.id) return;
      this.boostService.isBoosted(f.id).subscribe(res => {
        if (res.boosted && !this.boostedIds.includes(f.id!)) {
          this.boostedIds.push(f.id!);
        }
      });
    });
  }

  isBoosted(id?: number): boolean {
    return id != null && this.boostedIds.includes(id);
  }

  loadUnreadCount(): void {
    this.notificationService.countUnread(1).subscribe({
      next: (res) => this.unreadCount = res.count
    });
  }

  load(): void {
    this.loading = true;
    this.error = undefined;
    this.service.getAll().subscribe({
      next: (res) => {
        this.furnitures = (res || []).map(f => ({
          ...f,
          isFavorite: this.favorites.some(fav => fav.id === f.id)
        }));
        this.applyFilters();
        this.checkBoosts();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load furniture list.';
        this.loading = false;
      },
    });
  }

  // ❤️ FAVORIS
  loadFavorites(): void {
    const saved = localStorage.getItem('furniture_favorites');
    this.favorites = saved ? JSON.parse(saved) : [];
  }

  toggleFavorite(f: Furniture): void {
    f.isFavorite = !f.isFavorite;
    if (f.isFavorite) {
      this.favorites.push(f);
    } else {
      this.favorites = this.favorites.filter(fav => fav.id !== f.id);
    }
    localStorage.setItem('furniture_favorites', JSON.stringify(this.favorites));
  }

  isFavorite(f: Furniture): boolean {
    return this.favorites.some(fav => fav.id === f.id);
  }

  // 📄 EXPORT PDF
  exportToPdf(f: Furniture): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${f.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #1a237e; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 4px; }
            .good { background: #e8f5e9; color: #2e7d32; }
            .available { background: #e3f2fd; color: #1565c0; }
            .price { font-size: 28px; color: #1976d2; font-weight: bold; margin: 20px 0; }
            .info { margin: 10px 0; font-size: 15px; }
            .label { font-weight: bold; color: #555; }
            .footer { margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>🛋️ ${f.title}</h1>
          <div>
            <span class="badge good">${f.condition}</span>
            <span class="badge available">${f.status}</span>
          </div>
          <div class="price">$${f.price.toFixed(2)}</div>
          <div class="info"><span class="label">Description:</span> ${f.description || 'N/A'}</div>
          <div class="info"><span class="label">Catégorie:</span> ${f.category}</div>
          <div class="info"><span class="label">Quantité disponible:</span> ${f.quantity}</div>
          <div class="info"><span class="label">Vendeur ID:</span> ${f.sellerId}</div>
          <div class="footer">
            Généré le ${new Date().toLocaleDateString('fr-FR')} — Furniture Marketplace CoCo
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  // FILTRES
  applyFilters(): void {
    this.currentPage = 1;
    this.filtered = this.furnitures.filter(f => {
      const matchSearch = !this.searchTerm ||
        f.title?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchCategory = !this.selectedCategory || f.category === this.selectedCategory;
      const matchStatus = !this.selectedStatus || f.status === this.selectedStatus;
      const matchCondition = !this.selectedCondition || f.condition === this.selectedCondition;
      return matchSearch && matchCategory && matchStatus && matchCondition;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  get paginatedItems(): Furniture[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  optimizedImg(f: Furniture): string {
    const url = f.imageUrl || f.imageBase64;
    if (url && url.startsWith('https://res.cloudinary.com')) {
      return this.cloudinary.getOptimizedUrl(url, 320, 200);
    }
    return url || 'https://placehold.co/320x200/f5f5f5/999?text=No+Image';
  }

  getConditionClass(condition: string): string {
    switch (condition) {
      case 'GOOD': return 'badge-good';
      case 'FAIR': return 'badge-fair';
      case 'POOR': return 'badge-poor';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'badge-available';
      case 'SOLD': return 'badge-sold';
      case 'RESERVED': return 'badge-reserved';
      default: return '';
    }
  }

  deleteFurniture(id?: number): void {
    if (!id) return;
    const item = this.furnitures.find(f => f.id === id);
    const name = item?.title || 'cet article';
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    this.loading = true;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Échec de la suppression.';
        this.loading = false;
      },
    });
  }

  archiveFurniture(id?: number, title?: string): void {
    if (!id) return;
    if (!confirm(`Archiver "${title}" ? L'article sera masqué de la liste.`)) return;
    this.service.update(id, { status: 'ARCHIVED' } as any).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Échec de l\'archivage.'; }
    });
  }

  cartErrorMsg = '';
  cartErrorVisible = false;
  private cartErrorTimer?: ReturnType<typeof setTimeout>;

  addToCart(furniture: any): void {
    const added = this.cartService.addItem({
      furnitureId: furniture.id,
      furnitureTitle: furniture.title,
      price: furniture.price,
      quantity: 1
    });
    if (!added) {
      this.cartErrorMsg = '\u26A0\uFE0F Cet article est d\u00E9j\u00E0 dans votre panier !';
      this.cartErrorVisible = true;
      clearTimeout(this.cartErrorTimer);
      this.cartErrorTimer = setTimeout(() => { this.cartErrorVisible = false; }, 3000);
    }
  }
}