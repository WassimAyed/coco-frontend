import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedModule } from '../shared/shared.module';
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
    AdminOverviewPanelComponent,
    AdminSettingsPanelComponent,
    AdminServicesPanelComponent,
    AdminSidebarComponent,
    AdminSignalsPanelComponent,
    AdminTopbarComponent,
    AdminUserManagementComponent,
  ],
  exports: [AdminLayoutComponent],
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, SharedModule],
})
export class AdminModule {}
