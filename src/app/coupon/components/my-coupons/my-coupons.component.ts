import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CouponService } from '../../services/coupon.service';
import { UserCoupon } from '../../models/coupon.model';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-my-coupons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-coupons.component.html',
  styleUrls: ['./my-coupons.component.css']
})
export class MyCouponsComponent implements OnInit {
  myCoupons: UserCoupon[] = [];
  filteredCoupons: UserCoupon[] = [];
  activeFilter = 'ALL';
  message = '';
  showQr: number | null = null;

  private couponService = inject(CouponService);
  private userService = inject(UserService);

  get userId(): number {
    const user = this.userService.currentUser();
    return user ? Number(user.id) : 1;
  }

  ngOnInit(): void {
    this.loadMyCoupons();
  }

  get activeCount(): number { return this.myCoupons.filter(c => c.status === 'CLAIMED').length; }
  get usedCount(): number { return this.myCoupons.filter(c => c.status === 'USED').length; }
  get expiredCount(): number { return this.myCoupons.filter(c => c.status === 'EXPIRED').length; }

  loadMyCoupons(): void {
    if (!this.userId) return;
    this.couponService.getMyCoupons(this.userId).subscribe({
      next: (data) => { this.myCoupons = data; this.applyFilter(this.activeFilter); },
      error: () => console.error('Error loading my coupons')
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    if (filter === 'ALL') this.filteredCoupons = [...this.myCoupons];
    else this.filteredCoupons = this.myCoupons.filter(c => c.status === filter);
  }

  toggleQr(id: number): void {
    this.showQr = this.showQr === id ? null : id;
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