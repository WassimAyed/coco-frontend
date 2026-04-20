import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule],
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

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.couponService.getAvailableCoupons().subscribe({
      next: (data) => {
        this.coupons = data;
        this.filteredCoupons = data;
        if (this.userId) {
          this.loadRecommendations();
          this.loadUserCluster();
        }
      },
      error: () => console.error('Error loading coupons')
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
      next: (res) => this.userCluster = res,
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
      this.claimedMessage = 'Veuillez vous connecter pour reclamer un coupon';
      this.claimedMessageType = 'error';
      setTimeout(() => this.claimedMessage = '', 3000);
      return;
    }
    this.couponService.claimCoupon(couponId, this.userId).subscribe({
      next: () => {
        this.claimedMessage = 'Coupon reclame avec succes!';
        this.claimedMessageType = 'success';
        setTimeout(() => this.claimedMessage = '', 3000);
        this.loadCoupons();
      },
      error: (err) => {
        this.claimedMessage = err.error?.message || 'Erreur lors de la reclamation';
        this.claimedMessageType = 'error';
        setTimeout(() => this.claimedMessage = '', 3000);
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