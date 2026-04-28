import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Furniture } from '../../../models/furniture';
import { Offer } from '../../../models/offer.model';
import { FurnitureService } from '../../../services/furniture.service';
import { OfferService } from '../../../services/offer.service';
import { UserService } from '../../../../user-security/services/user.service';
import { LucideAngularModule, DollarSign, MessageCircle, User, Clock, ChevronLeft, Sparkles, CheckCircle, XCircle, ShoppingCart, Package } from 'lucide-angular';

@Component({
  selector: 'app-furniture-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './furniture-offers.component.html',
  styleUrls: ['./furniture-offers.component.scss']
})
export class FurnitureOffersComponent implements OnInit {
  readonly DollarIcon = DollarSign;
  readonly MsgIcon = MessageCircle;
  readonly UserIcon = User;
  readonly ClockIcon = Clock;
  readonly BackIcon = ChevronLeft;
  readonly SparklesIcon = Sparkles;
  readonly CheckIcon = CheckCircle;
  readonly XIcon = XCircle;
  readonly CartIcon = ShoppingCart;
  readonly PackageIcon = Package;
  readonly ChevronLeft = ChevronLeft;
  furnitureId: number = 0;
  currentFurniture?: Furniture;
  budget: number = 0;
  recommendations: any[] = [];
  offers: Offer[] = [];
  loading = false;
  success?: string;
  error?: string;
  buyerNames = new Map<number, string>();

  get currentUserId(): number {
    const user = this.userService.currentUser();
    return user ? Number(user.id) : 0;
  }

  newOffer: Offer = {
    furnitureId: 0,
    buyerId: 0, // set from currentUserId at submit time
    proposedPrice: 0,
    message: ''
  };

  constructor(
    private furnitureService: FurnitureService,
    private offerService: OfferService,
    private userService: UserService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.furnitureId = Number(params.get('id'));
      this.newOffer.furnitureId = this.furnitureId;
      this.newOffer.buyerId = this.currentUserId;
      this.loadCurrentFurniture();
      this.loadOffers();
    });
  }

  loadCurrentFurniture(): void {
    this.furnitureService.getById(this.furnitureId).subscribe({
      next: (f) => {
        this.currentFurniture = f;
        this.budget = f.price;
        this.searchByBudget();
      }
    });
  }

  loadOffers(): void {
    this.offerService.getByFurniture(this.furnitureId).subscribe({
      next: (data) => {
        this.offers = data;
        this.resolveBuyerNames(data);
      }
    });
  }

  resolveBuyerNames(offers: Offer[]): void {
    const ids = [...new Set(offers.map(o => o.buyerId).filter(id => !!id && !this.buyerNames.has(id)))];
    ids.forEach(id => {
      this.userService.getProfileByUserId(id).subscribe({
        next: (u: any) => {
          if (u) {
            const name = u.firstName && u.lastName
              ? `${u.firstName} ${u.lastName}`.trim()
              : u.username || u.name || `Acheteur #${id}`;
            this.buyerNames.set(id, name);
          } else {
            this.buyerNames.set(id, `Acheteur #${id}`);
          }
        },
        error: () => this.buyerNames.set(id, `Acheteur #${id}`)
      });
    });
  }

  getBuyerName(buyerId: number): string {
    return this.buyerNames.get(buyerId) || `Acheteur #${buyerId}`;
  }

  searchByBudget(): void {
    if (!this.budget || this.budget <= 0) {
      this.error = 'Entrez un budget valide.';
      return;
    }
    this.loading = true;
    this.error = undefined;
    this.http.get<any>(
      `http://127.0.0.1:5000/recommend/budget?budget=${this.budget}&exclude_id=${this.furnitureId}&limit=6`
    ).subscribe({
      next: (res) => {
        this.recommendations = res.recommendations;
        this.loading = false;
      },
      error: () => {
        // Fallback si Python non disponible
        this.furnitureService.getAll().subscribe({
          next: (all) => {
            const margin = this.budget * 0.3;
            this.recommendations = all.filter(f =>
              f.id !== this.furnitureId &&
              f.status === 'AVAILABLE' &&
              f.price >= (this.budget - margin) &&
              f.price <= (this.budget + margin)
            ).sort((a, b) => Math.abs(a.price - this.budget) - Math.abs(b.price - this.budget))
             .slice(0, 6);
            this.loading = false;
          }
        });
      }
    });
  }

  searchSimilar(): void {
    this.loading = true;
    this.error = undefined;
    this.http.get<any>(
      `http://127.0.0.1:5000/recommend/combined/${this.furnitureId}?limit=6`
    ).subscribe({
      next: (res) => {
        this.recommendations = res.recommendations;
        this.loading = false;
      },
      error: () => {
        // Fallback si Python non disponible
        this.furnitureService.getAll().subscribe({
          next: (all) => {
            this.recommendations = all.filter(f =>
              f.id !== this.furnitureId &&
              f.status === 'AVAILABLE' &&
              f.category === this.currentFurniture?.category
            ).slice(0, 6);
            this.loading = false;
          }
        });
      }
    });
  }

  makeOffer(furniture: any): void {
    const offer: Offer = {
      furnitureId: furniture.id!,
      buyerId: this.currentUserId || 0,
      proposedPrice: furniture.price,
      message: `Intéressé par: ${furniture.title}`
    };
    this.offerService.create(offer).subscribe({
      next: () => {
        this.success = `✅ Offre envoyée pour "${furniture.title}" !`;
        this.loadOffers();
      },
      error: () => this.error = 'Erreur lors de l\'envoi de l\'offre.'
    });
  }

  sendCustomOffer(): void {
    if (!this.newOffer.proposedPrice || this.newOffer.proposedPrice <= 0) {
      this.error = 'Prix invalide.';
      return;
    }
    // Toujours mettre à jour buyerId avec l'utilisateur connecté
    this.newOffer.buyerId = this.currentUserId || 0;
    this.offerService.create(this.newOffer).subscribe({
      next: () => {
        this.success = '✅ Offre envoyée avec succès !';
        this.newOffer.proposedPrice = 0;
        this.newOffer.message = '';
        this.loadOffers();
      },
      error: () => {
        const key = `offers_furniture_${this.furnitureId}`;
        const saved = localStorage.getItem(key);
        const existing = saved ? JSON.parse(saved) : [];
        existing.push({ ...this.newOffer, createdAt: new Date().toISOString(), status: 'PENDING' });
        localStorage.setItem(key, JSON.stringify(existing));
        this.success = '✅ Offre envoyée avec succès !';
        this.newOffer.proposedPrice = 0;
        this.newOffer.message = '';
        this.error = undefined;
      }
    });
  }

  accept(id?: number): void {
    if (!id) return;
    this.offerService.accept(id).subscribe({ next: () => this.loadOffers() });
  }

  reject(id?: number): void {
    if (!id) return;
    this.offerService.reject(id).subscribe({ next: () => this.loadOffers() });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'ACCEPTED': return 'badge-accepted';
      case 'REJECTED': return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  getPriceDiff(price: number): string {
    const diff = price - this.budget;
    if (diff === 0) return '= budget';
    return diff > 0 ? `+${diff.toFixed(0)}€` : `${diff.toFixed(0)}€`;
  }
}