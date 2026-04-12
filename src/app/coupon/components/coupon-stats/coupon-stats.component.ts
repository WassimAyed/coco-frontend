import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';

@Component({
  selector: 'app-coupon-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coupon-stats.component.html',
  styleUrls: ['./coupon-stats.component.css']
})
export class CouponStatsComponent implements OnInit {
  totalCoupons = 0;
  activeCoupons = 0;
  inactiveCoupons = 0;
  totalClaimed = 0;
  expiredCoupons = 0;
  categoryCounts: { name: string; count: number; icon: string }[] = [];

  constructor(private couponService: CouponService) {}

  ngOnInit(): void {
    this.couponService.getAllCoupons().subscribe({
      next: (coupons) => {
        this.totalCoupons = coupons.length;
        this.activeCoupons = coupons.filter(c => c.isActive && c.available).length;
        this.inactiveCoupons = coupons.filter(c => !c.isActive).length;
        this.totalClaimed = coupons.reduce((sum, c) => sum + c.currentUsage, 0);
        this.expiredCoupons = coupons.filter(c => new Date(c.expirationDate) < new Date()).length;
        this.calculateCategoryCounts(coupons);
      }
    });
  }

  calculateCategoryCounts(coupons: Coupon[]): void {
    const icons: Record<string, string> = {
      CINEMA: '🎬', RESTAURANT: '🍽️', TRANSPORT: '🚗',
      SUBSCRIPTION: '⭐', FITNESS: '💪', SHOPPING: '🛍️',
      COWORKING: '💻', OTHER: '🎁'
    };
    const counts: Record<string, number> = {};
    coupons.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    this.categoryCounts = Object.entries(counts).map(([name, count]) => ({
      name, count, icon: icons[name] || '🎁'
    }));
  }
}