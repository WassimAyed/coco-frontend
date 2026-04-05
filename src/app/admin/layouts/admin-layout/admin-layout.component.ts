import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ServiceModerationStatus,
  StudentService,
} from '../../../student-services/models/student-service.model';
import { StudentServicesApiService } from '../../../student-services/services/student-services-api.service';
import { UserService } from '../../../user-security/services/user.service';
import {
  ADMIN_DASHBOARD_MODULES,
  AdminDashboardModuleId,
} from '../../data/admin-dashboard.data';
import { AdminSignal } from '../../models/admin-signal.model';
import { AdminUser } from '../../models/admin-user.model';
import { AdminSignalApiService } from '../../services/admin-signal-api.service';
import { AdminUserApiService } from '../../services/admin-user-api.service';

@Component({
  standalone: false,
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  private readonly adminSignalApiService = inject(AdminSignalApiService);
  private readonly adminUserApiService = inject(AdminUserApiService);
  private readonly router = inject(Router);
  private readonly studentServicesApiService = inject(StudentServicesApiService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  readonly adminUser = computed(() => this.userService.currentUser());
  readonly busyUserIds = signal<number[]>([]);
  readonly isLoadingServices = signal(false);
  readonly isLoadingSignals = signal(false);
  readonly isLoadingUsers = signal(false);
  readonly signalsError = signal<string | null>(null);
  readonly modules = ADMIN_DASHBOARD_MODULES;
  readonly selectedModule = signal<AdminDashboardModuleId>('overview');
  readonly services = signal<StudentService[]>([]);
  readonly servicesModerationFilter =
    signal<ServiceModerationStatus | 'all'>('all');
  readonly signals = signal<AdminSignal[]>([]);
  readonly usersError = signal<string | null>(null);
  readonly users = signal<AdminUser[]>([]);

  constructor() {
    void this.loadAdminUsers();
    void this.loadAdminSignals();
    this.loadAdminServices();
  }

  get selectedModuleName(): string {
    return (
      this.modules.find((module) => module.id === this.selectedModule())?.name ??
      'Dashboard'
    );
  }

  selectModule(moduleId: AdminDashboardModuleId): void {
    this.selectedModule.set(moduleId);

    if (moduleId === 'services') {
      this.loadAdminServices();
      return;
    }

    if (moduleId === 'users' && this.users().length === 0) {
      void this.loadAdminUsers();
      return;
    }

    if (moduleId === 'signals' && this.signals().length === 0) {
      void this.loadAdminSignals();
    }
  }

  setServicesModerationFilter(
    filter: ServiceModerationStatus | 'all',
  ): void {
    this.servicesModerationFilter.set(filter);
    this.loadAdminServices();
  }

  async disableUser(userId: number): Promise<void> {
    this.setUserBusy(userId, true);

    try {
      await this.adminUserApiService.disableUser(userId);
      this.users.update((users) =>
        users.map((user) =>
          user.id === userId ? { ...user, enabled: false } : user,
        ),
      );
      this.toastService.success('User disabled successfully.', 'User Updated');
    } catch {
      this.toastService.error(
        'Unable to disable this user right now.',
        'Update Failed',
      );
    } finally {
      this.setUserBusy(userId, false);
    }
  }

  async enableUser(userId: number): Promise<void> {
    this.setUserBusy(userId, true);

    try {
      await this.adminUserApiService.enableUser(userId);
      this.users.update((users) =>
        users.map((user) =>
          user.id === userId ? { ...user, enabled: true } : user,
        ),
      );
      this.toastService.success('User enabled successfully.', 'User Updated');
    } catch {
      this.toastService.error(
        'Unable to enable this user right now.',
        'Update Failed',
      );
    } finally {
      this.setUserBusy(userId, false);
    }
  }

  approveService(serviceId: string): void {
    this.studentServicesApiService
      .updateServiceModerationStatus(serviceId, 'approved')
      .subscribe((service) => {
        if (!service) {
          this.toastService.error(
            'Unable to approve this service.',
            'Approve Failed',
          );
          return;
        }

        this.toastService.success(
          'Service approved successfully.',
          'Service Approved',
        );
        this.loadAdminServices();
      });
  }

  rejectService(serviceId: string): void {
    this.studentServicesApiService
      .updateServiceModerationStatus(serviceId, 'rejected')
      .subscribe((service) => {
        if (!service) {
          this.toastService.error(
            'Unable to reject this service.',
            'Reject Failed',
          );
          return;
        }

        this.toastService.info('Service rejected.', 'Service Updated');
        this.loadAdminServices();
      });
  }

  updateServiceTags(payload: { serviceId: string; tags: string[] }): void {
    this.studentServicesApiService
      .updateServiceTags(payload.serviceId, payload.tags)
      .subscribe((service) => {
        if (!service) {
          this.toastService.error(
            'Unable to update service tags.',
            'Tags Update Failed',
          );
          return;
        }

        this.services.update((services) =>
          services.map((item) =>
            item.id === payload.serviceId ? { ...item, tags: service.tags } : item,
          ),
        );
        this.toastService.success(
          'Service tags updated successfully.',
          'Tags Updated',
        );
      });
  }

  deleteServicePost(serviceId: string): void {
    this.studentServicesApiService.deleteService(serviceId).subscribe((deleted) => {
      if (!deleted) {
        this.toastService.error(
          'Unable to delete this service.',
          'Delete Failed',
        );
        return;
      }

      this.toastService.success(
        'Service deleted successfully.',
        'Service Removed',
      );
      this.loadAdminServices();
    });
  }

  async logout(): Promise<void> {
    this.userService.logout();
    await this.router.navigate(['/']);
  }

  private loadAdminServices(): void {
    this.isLoadingServices.set(true);
    this.studentServicesApiService
      .getAdminServices(this.servicesModerationFilter())
      .subscribe({
        next: (services) => {
          this.services.set(services);
          this.isLoadingServices.set(false);
        },
        error: () => {
          this.toastService.error(
            'Unable to load services moderation right now.',
            'Services Unavailable',
          );
          this.isLoadingServices.set(false);
        },
      });
  }

  private async loadAdminSignals(): Promise<void> {
    this.isLoadingSignals.set(true);
    this.signalsError.set(null);

    try {
      const signals = await this.adminSignalApiService.getAllSignals();
      this.signals.set(signals);
    } catch {
      this.signals.set([]);
      this.signalsError.set('Unable to load signals. Check admin authorization.');
      this.toastService.error(
        'Unable to load platform signals right now.',
        'Signals Unavailable',
      );
    } finally {
      this.isLoadingSignals.set(false);
    }
  }

  private async loadAdminUsers(): Promise<void> {
    this.isLoadingUsers.set(true);
    this.usersError.set(null);

    try {
      const users = await this.adminUserApiService.getAllUsers();
      this.users.set(users);
    } catch {
      this.users.set([]);
      this.usersError.set('Unable to load users. Check admin authorization.');
      this.toastService.error('Unable to load users right now.', 'Users Unavailable');
    } finally {
      this.isLoadingUsers.set(false);
    }
  }

  private setUserBusy(userId: number, busy: boolean): void {
    this.busyUserIds.update((ids) =>
      busy ? [...ids, userId] : ids.filter((id) => id !== userId),
    );
  }
}

