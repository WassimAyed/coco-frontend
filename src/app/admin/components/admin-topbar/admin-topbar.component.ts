import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bell, ChevronDown, LucideAngularModule } from 'lucide-angular';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import { UserProfile } from '../../../user-security/models/user.model';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  standalone: true,
  selector: 'app-admin-topbar',
  templateUrl: './admin-topbar.component.html',
  imports: [CommonModule, LucideAngularModule, SharedModule],
})
export class AdminTopbarComponent {
  @Input() adminUser: UserProfile | null = null;

  readonly BellIcon = Bell;
  readonly ChevronDownIcon = ChevronDown;

  get avatarUrl(): string {
    return this.adminUser?.avatarUrl || createAvatarDataUrl(this.displayName);
  }

  get displayName(): string {
    if (!this.adminUser) {
      return 'Admin User';
    }

    return `${this.adminUser.firstName} ${this.adminUser.lastName}`.trim();
  }

  get roleLabel(): string {
    return this.adminUser?.role === 'admin' ? 'Super Admin' : 'Administrator';
  }
}

