import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LogOut, Settings } from 'lucide-angular';
import {
  AdminDashboardModule,
  AdminDashboardModuleId,
} from '../../data/admin-dashboard.data';

@Component({
  standalone: false,
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
})
export class AdminSidebarComponent {
  @Input({ required: true }) modules: AdminDashboardModule[] = [];
  @Input({ required: true }) selectedModuleId: AdminDashboardModuleId = 'overview';

  @Output() logoutClicked = new EventEmitter<void>();
  @Output() moduleSelected = new EventEmitter<AdminDashboardModuleId>();

  readonly LogOutIcon = LogOut;
  readonly SettingsIcon = Settings;
}

