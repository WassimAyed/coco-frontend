import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coupon-list.component.html',
  styleUrls: ['./coupon-list.component.css']
})
export class CouponListComponent implements OnInit {
  coupons: Coupon[] = [];
  filteredCoupons: Coupon[] = [];
  categories = ['ALL', 'CINEMA', 'RESTAURANT', 'TRANSPORT', 'SUBSCRIPTION', 'FITNESS', 'SHOPPING', 'COWORKING'];
  selectedCategory = 'ALL';
  claimedMessage = '';
  claimedMessageType = '';
  predictions: Map<number, any> = new Map();
  userCluster: any = null;

  private couponService = inject(CouponService);
  private userService = inject(UserService);

  get userId(): number {
    const user = this.userService.currentUser();
    return user ? Number(user.id) : 1;
  }

  get isAdmin(): boolean {
    const role = (this.userService.currentUser()?.role || '').toLowerCase();
    return role.includes('admin');
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.couponService.getAvailableCoupons().subscribe({
      next: (data) => {
        this.coupons = data;
        this.filteredCoupons = data;
        if (!this.userCluster) {
          this.userCluster = { segmentName: 'Explorateur CoCo', description: 'Tu aimes découvrir toutes les opportunités du campus.' };
        }
        if (this.userId) {
          this.loadRecommendations();
          this.loadUserCluster();
        }
      },
      error: () => {
        console.error('Error loading coupons');
        if (!this.userCluster) {
          this.userCluster = { segmentName: 'Explorateur CoCo', description: 'Tu aimes découvrir toutes les opportunités du campus.' };
        }
      }
    });
  }

  loadRecommendations(): void {
    this.couponService.getRecommendations(this.userId).subscribe({
      next: (res) => {
        if (res.predictions) {
          res.predictions.forEach((p: any) => {
            this.predictions.set(p.couponId, p);
          });
          this.sortByRecommendation();
        }
      },
      error: () => console.log('ML service non disponible')
    });
  }

  loadUserCluster(): void {
    this.couponService.getUserCluster(this.userId).subscribe({
      next: (res) => {
        // Mapping des IDs de segments vers des noms explicites
        const segments: Record<string, any> = {
          '0': { name: 'Étudiant Éco-Responsable', desc: 'Tu privilégies les offres durables et locales.' },
          '1': { name: 'Passionné de Tech & Ciné', desc: 'Toujours à l\'affût des dernières sorties et gadgets.' },
          '2': { name: 'Gourmet du Campus', desc: 'Expert en bons plans restos et livraison.' },
          '3': { name: 'Sportif & Dynamique', desc: 'Les offres fitness et transport sont pour toi.' }
        };
        
        const rawId = String(res.segmentName || res);
        const segment = segments[rawId] || { name: 'Explorateur CoCo', desc: 'Tu aimes découvrir toutes les opportunités du campus.' };
        
        this.userCluster = {
          segmentName: segment.name,
          description: segment.desc
        };
      },
      error: () => console.log('Clustering non disponible')
    });
  }

  sortByRecommendation(): void {
    this.filteredCoupons.sort((a, b) => {
      const pa = this.predictions.get(a.id)?.probability || 0;
      const pb = this.predictions.get(b.id)?.probability || 0;
      return pb - pa;
    });
  }

  getPrediction(couponId: number): any {
    return this.predictions.get(couponId);
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'ALL') {
      this.filteredCoupons = [...this.coupons];
    } else {
      this.filteredCoupons = this.coupons.filter(c => c.category === category);
    }
    if (this.predictions.size > 0) {
      this.sortByRecommendation();
    }
  }

  claimCoupon(couponId: number): void {
    if (!this.userId) {
      this.claimedMessage = '🔒 Connecte-toi pour réclamer un coupon';
      this.claimedMessageType = 'error';
      setTimeout(() => this.claimedMessage = '', 3000);
      return;
    }
    this.couponService.claimCoupon(couponId, this.userId).subscribe({
      next: () => {
        this.claimedMessage = '✅ Coupon ajouté à ta liste !';
        this.claimedMessageType = 'success';
        setTimeout(() => this.claimedMessage = '', 4000);
        this.loadCoupons();
      },
      error: (err) => {
        const msg: string = err.error?.message || err.error?.error || '';
        const status: number = err.status;
        if (status === 0) {
          this.claimedMessage = '⚠️ Service indisponible. Réessaie plus tard.';
          this.claimedMessageType = 'error';
        } else if (status === 401 || status === 403) {
          this.claimedMessage = '🔒 Connecte-toi pour réclamer un coupon.';
          this.claimedMessageType = 'error';
        } else if (status === 409 || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('déjà')) {
          this.claimedMessage = '⚠️ Tu as déjà réclamé ce coupon';
          this.claimedMessageType = 'warning';
        } else if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('expiré')) {
          this.claimedMessage = '⏰ Ce coupon a expiré.';
          this.claimedMessageType = 'error';
        } else if (msg.toLowerCase().includes('max') || msg.toLowerCase().includes('limite')) {
          this.claimedMessage = '🚫 Ce coupon a atteint son quota maximum.';
          this.claimedMessageType = 'error';
        } else {
          this.claimedMessage = msg || '❌ Erreur lors de la réclamation. Réessaie.';
          this.claimedMessageType = 'error';
        }
        setTimeout(() => this.claimedMessage = '', 4000);
      }
    });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      CINEMA: '🎬', RESTAURANT: '🍽️', TRANSPORT: '🚗',
      SUBSCRIPTION: '⭐', FITNESS: '💪', SHOPPING: '🛍️',
      COWORKING: '💻', OTHER: '🎁'
    };
    return icons[category] || '🎁';
  }

  getDaysLeft(expirationDate: string): number {
    const now = new Date();
    const exp = new Date(expirationDate);
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
}