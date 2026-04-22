import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedModule } from '../shared/shared.module';
import { AdminCollocationComponent } from '../collocation/components/admin-collocation/admin-collocation.component';
import { AdminCovoiturageComponent } from '../covoiturage/components/admin-covoiturage/admin-covoiturage.component';
import { AdminPlansComponent } from '../subs-payment/components/admin-plans/admin-plans.component';
import { EventPaginationModule } from '../event/event-pagination.module';
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
  declarations: [
    AdminLayoutComponent,
    AdminEventsComponent,
    AdminOverviewPanelComponent,
    AdminSettingsPanelComponent,
    AdminServicesPanelComponent,
    AdminSidebarComponent,
    AdminSignalsPanelComponent,
    AdminTopbarComponent,
    AdminUserManagementComponent,
  ],
  exports: [AdminLayoutComponent],
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ReactiveFormsModule,
    SharedModule,
    EventPaginationModule,
    AdminPlansComponent,
    AdminCovoiturageComponent,
    AdminCollocationComponent,
  ],
})
export class AdminModule {}
