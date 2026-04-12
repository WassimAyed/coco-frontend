import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../services/coupon.service';
import { UserCoupon } from '../../models/coupon.model';

@Component({
  selector: 'app-my-coupons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-coupons.component.html',
  styleUrls: ['./my-coupons.component.css']
})
export class MyCouponsComponent implements OnInit {
  myCoupons: UserCoupon[] = [];
  userId = 1;
  message = '';

  constructor(private couponService: CouponService) {}

  ngOnInit(): void {
    this.loadMyCoupons();
  }

  loadMyCoupons(): void {
    this.couponService.getMyCoupons(this.userId).subscribe({
      next: (data) => this.myCoupons = data,
      error: (err) => console.error('Error loading my coupons', err)
    });
  }

  useCoupon(couponId: number): void {
    this.couponService.useCoupon(couponId, this.userId).subscribe({
      next: () => {
        this.message = 'Coupon utilise avec succes!';
        setTimeout(() => this.message = '', 3000);
        this.loadMyCoupons();
      },
      error: (err) => {
        this.message = err.error?.message || 'Erreur';
        setTimeout(() => this.message = '', 3000);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { CLAIMED: '🟢 Actif', USED: '✅ Utilise', EXPIRED: '🔴 Expire' };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase();
  }
}