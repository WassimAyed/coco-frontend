import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponRoutingModule } from './coupon-routing.module';
import { CouponListComponent } from './components/coupon-list/coupon-list.component';
import { MyCouponsComponent } from './components/my-coupons/my-coupons.component';
import { AdminCouponsComponent } from './components/admin-coupons/admin-coupons.component';
import { CouponStatsComponent } from './components/coupon-stats/coupon-stats.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CouponRoutingModule,
    CouponListComponent,
    MyCouponsComponent,
    AdminCouponsComponent,
    CouponStatsComponent
  ]
})
export class CouponModule {}