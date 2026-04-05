import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Ban, CheckCircle2, Search, ShieldCheck } from 'lucide-angular';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import { AdminUser } from '../../models/admin-user.model';

type UserStatusFilter = 'all' | 'active' | 'disabled' | 'admin';

@Component({
  standalone: false,
  selector: 'app-admin-user-management',
  templateUrl: './admin-user-management.component.html',
})
export class AdminUserManagementComponent {
  @Input() busyUserIds: number[] = [];
  @Input() errorMessage: string | null = null;
  @Input() isLoading = false;
  @Input() users: AdminUser[] = [];

  @Output() disableUser = new EventEmitter<number>();
  @Output() enableUser = new EventEmitter<number>();

  readonly BanIcon = Ban;
  readonly CheckCircleIcon = CheckCircle2;
  readonly SearchIcon = Search;
  readonly ShieldCheckIcon = ShieldCheck;

  searchTerm = '';
  statusFilter: UserStatusFilter = 'all';

  get filteredUsers(): AdminUser[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.users.filter((user) => {
      const role = user.role.toUpperCase();
      const enabled = user.enabled ?? true;

      if (this.statusFilter === 'active' && !enabled) {
        return false;
      }

      if (this.statusFilter === 'disabled' && enabled) {
        return false;
      }

      if (this.statusFilter === 'admin' && role !== 'ADMIN') {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack =
        `${user.username} ${user.lastname} ${user.email} ${user.role}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  isBusy(userId: number): boolean {
    return this.busyUserIds.includes(userId);
  }

  isEnabled(user: AdminUser): boolean {
    return user.enabled ?? true;
  }

  resolveAvatar(user: AdminUser): string {
    return (
      user.imageUrl ||
      createAvatarDataUrl(`${user.username} ${user.lastname}`.trim())
    );
  }

  setStatusFilter(filter: UserStatusFilter): void {
    this.statusFilter = filter;
  }
}

