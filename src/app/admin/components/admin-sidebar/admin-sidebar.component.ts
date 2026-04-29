import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogOut, LucideAngularModule, Settings } from 'lucide-angular';
import {
  AdminDashboardModule,
  AdminDashboardModuleId,
} from '../../data/admin-dashboard.data';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  standalone: true,
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  imports: [CommonModule, LucideAngularModule, SharedModule],
})
export class AdminSidebarComponent {
  @Input({ required: true }) modules: AdminDashboardModule[] = [];
  @Input({ required: true }) selectedModuleId: AdminDashboardModuleId = 'overview';

  @Output() logoutClicked = new EventEmitter<void>();
  @Output() moduleSelected = new EventEmitter<AdminDashboardModuleId>();

  readonly LogOutIcon = LogOut;
  readonly SettingsIcon = Settings;
}

