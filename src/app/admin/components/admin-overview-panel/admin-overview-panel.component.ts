import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Briefcase,
  LucideAngularModule,
  LucideIconData,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-angular';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import { StudentService } from '../../../student-services/models/student-service.model';
import { AdminSignal } from '../../models/admin-signal.model';
import { AdminUser } from '../../models/admin-user.model';

interface OverviewCard {
  colorClass: string;
  icon: LucideIconData;
  label: string;
  value: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-overview-panel',
  templateUrl: './admin-overview-panel.component.html',
  imports: [CommonModule, LucideAngularModule],
})
export class AdminOverviewPanelComponent {
  @Input() services: StudentService[] = [];
  @Input() signals: AdminSignal[] = [];
  @Input() users: AdminUser[] = [];

  get cards(): OverviewCard[] {
    const adminUsersCount = this.users.filter(
      (user) => user.role.toUpperCase() === 'ADMIN',
    ).length;
    const twoFactorCount = this.users.filter((user) => user.twoFactorEnabled).length;

    return [
      {
        colorClass: 'text-primary',
        icon: Users,
        label: 'Total users',
        value: `${this.users.length}`,
      },
      {
        colorClass: 'text-emerald-600',
        icon: ShieldCheck,
        label: '2FA enabled',
        value: `${twoFactorCount}`,
      },
      {
        colorClass: 'text-amber-600',
        icon: TriangleAlert,
        label: 'Signals reported',
        value: `${this.signals.length}`,
      },
      {
        colorClass: 'text-blue-600',
        icon: Briefcase,
        label: 'Services listed',
        value: `${this.services.length}`,
      },
      {
        colorClass: 'text-violet-600',
        icon: Users,
        label: 'Admin accounts',
        value: `${adminUsersCount}`,
      },
    ];
  }

  get recentUsers(): AdminUser[] {
    return this.users.slice(0, 5);
  }

  resolveAvatar(user: AdminUser): string {
    return (
      user.imageUrl ||
      createAvatarDataUrl(`${user.username} ${user.lastname}`.trim())
    );
  }
}

