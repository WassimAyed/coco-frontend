import { Component, Input } from '@angular/core';
import { Bell, ChevronDown } from 'lucide-angular';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import { UserProfile } from '../../../user-security/models/user.model';

@Component({
  standalone: false,
  selector: 'app-admin-topbar',
  templateUrl: './admin-topbar.component.html',
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

