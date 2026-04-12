import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';

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
  userId = 1;
  claimedMessage = '';

  constructor(private couponService: CouponService) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.couponService.getAvailableCoupons().subscribe({
      next: (data) => {
        this.coupons = data;
        this.filteredCoupons = data;
      },
      error: (err) => console.error('Error loading coupons', err)
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'ALL') {
      this.filteredCoupons = this.coupons;
    } else {
      this.filteredCoupons = this.coupons.filter(c => c.category === category);
    }
  }

  claimCoupon(couponId: number): void {
    this.couponService.claimCoupon(couponId, this.userId).subscribe({
      next: () => {
        this.claimedMessage = 'Coupon reclame avec succes!';
        setTimeout(() => this.claimedMessage = '', 3000);
        this.loadCoupons();
      },
      error: (err) => {
        this.claimedMessage = err.error?.message || 'Erreur lors de la reclamation';
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