import { NgModule } from '@angular/core';
import { AdminCollocationComponent } from '../collocation/components/admin-collocation/admin-collocation.component';
import { AdminCouponsComponent } from '../coupon/components/admin-coupons/admin-coupons.component';
import { AdminCovoiturageComponent } from '../covoiturage/components/admin-covoiturage/admin-covoiturage.component';
import { AdminMarketplacePanelComponent } from './components/admin-marketplace-panel/admin-marketplace-panel.component';
import { AdminPlansComponent } from '../subs-payment/components/admin-plans/admin-plans.component';
import { AdminEventsComponent } from './components/admin-events/admin-events.component';
import { AdminOverviewPanelComponent } from './components/admin-overview-panel/admin-overview-panel.component';
import { AdminSettingsPanelComponent } from './components/admin-settings-panel/admin-settings-panel.component';
import { AdminServicesPanelComponent } from './components/admin-services-panel/admin-services-panel.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminSignalsPanelComponent } from './components/admin-signals-panel/admin-signals-panel.component';
import { AdminTopbarComponent } from './components/admin-topbar/admin-topbar.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

@NgModule({
  exports: [AdminLayoutComponent],
  imports: [
    AdminLayoutComponent,
    AdminEventsComponent,
    AdminOverviewPanelComponent,
    AdminSettingsPanelComponent,
    AdminServicesPanelComponent,
    AdminSidebarComponent,
    AdminSignalsPanelComponent,
    AdminTopbarComponent,
    AdminUserManagementComponent,
    AdminPlansComponent,
    AdminCovoiturageComponent,
    AdminCollocationComponent,
    AdminCouponsComponent,
    AdminMarketplacePanelComponent,
  ],
})
export class AdminModule {}
