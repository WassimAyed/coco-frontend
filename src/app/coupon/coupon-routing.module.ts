import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CouponListComponent } from './components/coupon-list/coupon-list.component';
import { MyCouponsComponent } from './components/my-coupons/my-coupons.component';
import { AdminCouponsComponent } from './components/admin-coupons/admin-coupons.component';
import { CouponStatsComponent } from './components/coupon-stats/coupon-stats.component';

const routes: Routes = [
  { path: '', component: CouponListComponent },
  { path: 'my-coupons', component: MyCouponsComponent },
  { path: 'admin', component: AdminCouponsComponent },
  { path: 'stats', component: CouponStatsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CouponRoutingModule {}