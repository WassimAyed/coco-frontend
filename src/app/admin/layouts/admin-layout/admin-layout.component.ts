import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AdminEventNotificationsService } from '../../services/admin-event-notifications.service';
import {
  Bell,
  Briefcase,
  Calendar,
  Car,
  ChartBar,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Download,
  EllipsisVertical,
  Eye,
  House,
  ListFilter,
  LogOut,
  LucideIconData,
  MessageCircle,
  Pencil,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Ticket,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
} from 'lucide-angular';
import { FurnitureService } from '../../../real-estate/services/furniture.service';
import { UserService } from '../../../user-security/services/user.service';
import { LostAndFoundService } from '../../../lost-found/services/lost-found.service';
import { ItemReportResponse } from '../../../lost-found/models/lost-item.model';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ServiceModerationStatus,
  StudentService,
} from '../../../student-services/models/student-service.model';
import { StudentServicesApiService } from '../../../student-services/services/student-services-api.service';
import { AdminSignal } from '../../models/admin-signal.model';
import { AdminUser } from '../../models/admin-user.model';
import { AdminSignalApiService } from '../../services/admin-signal-api.service';
import { AdminUserApiService } from '../../services/admin-user-api.service';

interface UserProfileDto {
  firstName?: string;
  lastName?: string;
  lastname?: string;
  username?: string;
}

interface DashboardModule {
  id: string;
  name: string;
  icon: LucideIconData;
}

// Interface for the notification panel
interface PendingEvent {
  id: number;
  title: string;
  time: string;
  type: string;
  username: string;
  lastname: string;
  email: string;
}

@Component({
  standalone: false,
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  private readonly moduleUrlMap: Record<string, string> = {
    carpooling: '/admin/covoiturage',
    colocation: '/admin/collocation',
  };

  private readonly userService = inject(UserService);
  private readonly furnitureService = inject(FurnitureService);
  private readonly lostAndFoundService = inject(LostAndFoundService);
  private readonly toast = inject(ToastService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);
  private readonly adminSignalApiService = inject(AdminSignalApiService);
  private readonly adminUserApiService = inject(AdminUserApiService);
  private readonly eventNotifications = inject(AdminEventNotificationsService);

  readonly selectedModule = signal('overview');
  readonly searchQuery = signal('');
  readonly user = this.userService.currentUser;

  // ─── Student services / signals / users state ────────────────────────────
  readonly busyUserIds = signal<number[]>([]);
  readonly isLoadingServices = signal(false);
  readonly isLoadingSignals = signal(false);
  readonly isLoadingUsers = signal(false);
  readonly signalsError = signal<string | null>(null);
  readonly services = signal<StudentService[]>([]);
  readonly servicesModerationFilter = signal<ServiceModerationStatus | 'all'>('all');
  readonly signals = signal<AdminSignal[]>([]);
  readonly usersError = signal<string | null>(null);
  readonly users = signal<AdminUser[]>([]);
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Notification panel ──────────────────────────────────────────────────
  readonly showNotifications = signal(false);

  readonly pendingEvents = computed<PendingEvent[]>(() =>
    this.eventNotifications.notifications().map(n => ({
      id: n.id,
      title: `Nouvel evenement cree : ${n.name}`,
      time: this.formatRelative(n.receivedAt),
      type: 'event',
      username: n.location ?? '',
      lastname: '',
      email: n.userId != null ? `Cree par user #${n.userId}` : ''
    }))
  );

  private lastSeenNotifId: number | null = null;

  constructor() {
    effect(() => {
      const list = this.eventNotifications.notifications();
      if (list.length === 0) return;
      const latest = list[0];
      if (this.lastSeenNotifId === latest.id) return;
      this.lastSeenNotifId = latest.id;
      this.toast.info(`Nouvel evenement : ${latest.name}`);
    });
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }

  markAsRead(notifId: number): void {
    this.eventNotifications.dismiss(notifId);
  }

  private formatRelative(ts: number): string {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return 'a l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
  }
  // ──────────────────────────────────────────────────────────────────────────

  readonly modules: DashboardModule[] = [
    { id: 'overview', name: 'Overview', icon: ChartBar },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'item-reports', name: 'Item Reports', icon: TriangleAlert },
    { id: 'signals', name: 'Signals', icon: TriangleAlert },
    { id: 'services', name: 'Services', icon: Briefcase },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
    { id: 'coupons', name: 'Coupons & Rewards', icon: Ticket },
    { id: 'fraud', name: 'Fraud Detection', icon: TriangleAlert },
    { id: 'carpooling', name: 'Covoiturage', icon: Car },
    { id: 'colocation', name: 'Colocation', icon: House },
    { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag },
    { id: 'events', name: 'Events', icon: Calendar },
    { id: 'chat', name: 'Chat Moderation', icon: MessageCircle },
    { id: 'analytics', name: 'Analytics', icon: ChartBar },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  readonly marketplaceCount = signal<number | null>(null);

  get kpiCards() {
    const count = this.marketplaceCount();
    const listingsValue = count === null ? '…' : count.toLocaleString();
    return [
      { title: 'Total Users', value: '2,547', change: '+12.5%', trend: 'up', icon: Users, color: 'text-primary' },
      { title: 'Active Listings', value: listingsValue, change: 'Marketplace', trend: 'up', icon: ShoppingBag, color: 'text-blue-600' },
      { title: 'Monthly Revenue', value: '45,678 DT', change: '+23.1%', trend: 'up', icon: CreditCard, color: 'text-green-600' },
      { title: 'Pending Approvals', value: '47', change: '-5.3%', trend: 'down', icon: Clock, color: 'text-orange-600' },
    ];
  }

  readonly pendingUsers = [
    { id: 1, name: 'Ahmed Ben Ali', email: 'ahmed.benali@esprit.tn', phone: '+21620111222', registeredDate: '2026-03-15', status: 'pending' },
    { id: 2, name: 'Sarah Tounsi', email: 'sarah.tounsi@esprit.tn', phone: '+21622111333', registeredDate: '2026-03-16', status: 'pending' },
    { id: 3, name: 'Mohamed Karim', email: 'mohamed.karim@esprit.tn', phone: '+21623111444', registeredDate: '2026-03-17', status: 'pending' },
    { id: 4, name: 'Leila Mansour', email: 'leila.mansour@esprit.tn', phone: '+21624111555', registeredDate: '2026-03-17', status: 'pending' },
    { id: 5, name: 'Youssef Gharbi', email: 'youssef.gharbi@esprit.tn', phone: '+21625111666', registeredDate: '2026-03-18', status: 'pending' },
  ];

  readonly recentActivity = [
    { id: 1, user: 'Ahmed K.', action: 'Created carpooling offer', time: '5 min ago', type: 'carpooling', icon: Car },
    { id: 2, user: 'Sarah M.', action: 'Listed apartment for colocation', time: '12 min ago', type: 'colocation', icon: House },
    { id: 3, user: 'Mohamed A.', action: 'Sold laptop on marketplace', time: '1 hour ago', type: 'marketplace', icon: ShoppingBag },
    { id: 4, user: 'Leila B.', action: 'Registered for event', time: '2 hours ago', type: 'event', icon: Calendar },
    { id: 5, user: 'Youssef T.', action: 'Subscribed to premium', time: '3 hours ago', type: 'subscription', icon: CreditCard },
  ];

  readonly fraudAlerts = [
    { id: 1, user: 'suspicious_user_123', reason: 'Multiple failed login attempts', severity: 'high', time: '10 min ago' },
    { id: 2, user: 'fake_listing_456', reason: 'Duplicate marketplace listings', severity: 'medium', time: '1 hour ago' },
    { id: 3, user: 'spam_account_789', reason: 'Spam messages detected', severity: 'high', time: '2 hours ago' },
  ];

  readonly SearchIcon = Search;
  readonly BellIcon = Bell;
  readonly ChevronDownIcon = ChevronDown;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly ClockIcon = Clock;
  readonly FilterIcon = ListFilter;
  readonly CheckCircleIcon = CircleCheck;
  readonly XCircleIcon = CircleX;
  readonly AlertTriangleIcon = TriangleAlert;
  readonly EyeIcon = Eye;
  readonly DownloadIcon = Download;
  readonly UsersIcon = Users;
  readonly MoreVerticalIcon = EllipsisVertical;
  readonly UserIcon = User;
  readonly EditIcon = Pencil;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;

  // ─── Item-reports state ───────────────────────────────────────────────────
  itemReports: ItemReportResponse[] = [];
  itemReportsLoading = false;
  itemReportsError = '';
  processingReportId: number | null = null;
  bulkProcessing = false;
  reporterNames = new Map<number, string>();
  ownerNames = new Map<number, string>();
  selectedReportIds = new Set<number>();
  // ──────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    void this.loadAdminUsers();
    void this.loadAdminSignals();
    this.loadAdminServices();
    this.loadMarketplaceCount();

    this.eventNotifications.connect();
    this.route.data.subscribe((data) => {
      const moduleId = data['module'];
      if (moduleId && this.modules.some((m) => m.id === moduleId)) {
        this.selectModule(moduleId);
      }
    });
    this.route.queryParamMap.subscribe((params) => {
      const moduleId = params.get('module');
      if (moduleId && this.modules.some((m) => m.id === moduleId)) {
        this.selectModule(moduleId);
      }
    });
  }

  ngOnDestroy(): void {
    this.eventNotifications.disconnect();
  }

  selectModule(moduleId: string): void {
    this.selectedModule.set(moduleId);

    if (this.moduleUrlMap[moduleId]) {
      const targetUrl = this.moduleUrlMap[moduleId];
      if (this.location.path() !== targetUrl) {
        this.location.replaceState(targetUrl);
      }
    }

    if (moduleId === 'item-reports') {
      this.loadItemReports();
      return;
    }

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

  // ─── Student services moderation ─────────────────────────────────────────
  setServicesModerationFilter(filter: ServiceModerationStatus | 'all'): void {
    this.servicesModerationFilter.set(filter);
    this.loadAdminServices();
  }

  approveService(serviceId: string): void {
    this.studentServicesApiService
      .updateServiceModerationStatus(serviceId, 'approved')
      .subscribe((service) => {
        if (!service) { this.toast.error('Unable to approve this service.', 'Approve Failed'); return; }
        this.toast.success('Service approved successfully.', 'Service Approved');
        this.loadAdminServices();
      });
  }

  rejectService(serviceId: string): void {
    this.studentServicesApiService
      .updateServiceModerationStatus(serviceId, 'rejected')
      .subscribe((service) => {
        if (!service) { this.toast.error('Unable to reject this service.', 'Reject Failed'); return; }
        this.toast.info('Service rejected.', 'Service Updated');
        this.loadAdminServices();
      });
  }

  updateServiceTags(payload: { serviceId: string; tags: string[] }): void {
    this.studentServicesApiService
      .updateServiceTags(payload.serviceId, payload.tags)
      .subscribe((service) => {
        if (!service) { this.toast.error('Unable to update service tags.', 'Tags Update Failed'); return; }
        this.services.update((list) =>
          list.map((item) => item.id === payload.serviceId ? { ...item, tags: service.tags } : item),
        );
        this.toast.success('Service tags updated successfully.', 'Tags Updated');
      });
  }

  deleteServicePost(serviceId: string): void {
    this.studentServicesApiService.deleteService(serviceId).subscribe((deleted) => {
      if (!deleted) { this.toast.error('Unable to delete this service.', 'Delete Failed'); return; }
      this.toast.success('Service deleted successfully.', 'Service Removed');
      this.loadAdminServices();
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Admin users ─────────────────────────────────────────────────────────
  async disableUser(userId: number): Promise<void> {
    this.setUserBusy(userId, true);
    try {
      await this.adminUserApiService.disableUser(userId);
      this.users.update((list) =>
        list.map((u) => (u.id === userId ? { ...u, enabled: false } : u)),
      );
      this.toast.success('User disabled successfully.', 'User Updated');
    } catch {
      this.toast.error('Unable to disable this user right now.', 'Update Failed');
    } finally {
      this.setUserBusy(userId, false);
    }
  }

  async enableUser(userId: number): Promise<void> {
    this.setUserBusy(userId, true);
    try {
      await this.adminUserApiService.enableUser(userId);
      this.users.update((list) =>
        list.map((u) => (u.id === userId ? { ...u, enabled: true } : u)),
      );
      this.toast.success('User enabled successfully.', 'User Updated');
    } catch {
      this.toast.error('Unable to enable this user right now.', 'Update Failed');
    } finally {
      this.setUserBusy(userId, false);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Item-reports methods ─────────────────────────────────────────────────
  loadItemReports(): void {
    this.itemReportsLoading = true;
    this.itemReportsError = '';
    this.lostAndFoundService.getReportsForModeration().subscribe({
      next: (reports) => {
        this.itemReports = (reports || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        this.selectedReportIds.clear();
        this.preloadReporterNames(this.itemReports);
        this.preloadOwnerNames(this.itemReports);
        this.itemReportsLoading = false;
      },
      error: (error) => {
        this.itemReportsError = error?.error?.message || 'Unable to load item reports.';
        this.itemReportsLoading = false;
      },
    });
  }

  keepReportedItem(report: ItemReportResponse): void {
    if (!this.isAdmin || !report?.id) return;
    this.processingReportId = report.id;
    this.lostAndFoundService
      .reviewReport(report.id, { status: 'REVIEWED', moderatorComment: 'Reviewed by admin. Item remains visible.' })
      .subscribe({
        next: () => { this.processingReportId = null; this.toast.success('Report marked as reviewed. Item kept visible.'); this.loadItemReports(); },
        error: () => { this.processingReportId = null; this.itemReportsError = 'Failed to mark report as reviewed.'; this.toast.error('Failed to mark report as reviewed.'); },
      });
  }

  blockReportedItem(report: ItemReportResponse): void {
    if (!this.isAdmin || !report?.id) return;
    this.processingReportId = report.id;
    this.lostAndFoundService
      .reviewReport(report.id, { status: 'ACTION_TAKEN', moderatorComment: 'Item blocked by admin after report review.' })
      .subscribe({
        next: () => { this.processingReportId = null; this.toast.warning('Item blocked successfully after report review.'); this.loadItemReports(); },
        error: () => { this.processingReportId = null; this.itemReportsError = 'Failed to block reported item.'; this.toast.error('Failed to block reported item.'); },
      });
  }

  isReportActionable(report: ItemReportResponse): boolean { return report.status === 'OPEN'; }
  isReportSelected(reportId?: number): boolean { return !!reportId && this.selectedReportIds.has(reportId); }

  toggleReportSelection(report: ItemReportResponse, checked: boolean): void {
    if (!report?.id || !this.isReportActionable(report)) return;
    checked ? this.selectedReportIds.add(report.id) : this.selectedReportIds.delete(report.id);
  }

  toggleAllReportSelection(checked: boolean): void {
    if (!checked) { this.selectedReportIds.clear(); return; }
    this.itemReports.filter((r) => this.isReportActionable(r) && !!r.id).forEach((r) => this.selectedReportIds.add(r.id as number));
  }

  keepSelectedReports(): void { this.processBulkReview('REVIEWED', 'Reviewed by admin. Item remains visible.', 'reviewed'); }
  blockSelectedReports(): void { this.processBulkReview('ACTION_TAKEN', 'Item blocked by admin after report review.', 'blocked'); }

  get selectedReportsCount(): number { return this.selectedReportIds.size; }

  get allActionableSelected(): boolean {
    const actionable = this.itemReports.filter((r) => this.isReportActionable(r) && !!r.id);
    return actionable.length > 0 && actionable.every((r) => this.selectedReportIds.has(r.id as number));
  }

  openItemDetails(report: ItemReportResponse): void {
    if (!report?.itemId) return;
    this.router.navigate(['/lost-found/details', report.itemId], { queryParams: report.id ? { reportId: report.id } : undefined });
  }

  getReporterDisplayName(reporterUserId: number): string {
    if (!reporterUserId) return 'Unknown user';
    return this.reporterNames.get(reporterUserId) || `User #${reporterUserId}`;
  }

  getOwnerDisplayName(ownerUserId?: number | null): string {
    if (!ownerUserId) return 'Unknown owner';
    return this.ownerNames.get(ownerUserId) || `User #${ownerUserId}`;
  }

  get isAdmin(): boolean { return (this.user()?.role || '').toLowerCase().includes('admin'); }
  get itemReportsBlockedCount(): number { return this.itemReports.filter((r) => r.itemStatus === 'BLOCKED').length; }
  get itemReportsReviewedCount(): number { return this.itemReports.filter((r) => r.status === 'REVIEWED').length; }
  get itemReportsActionTakenCount(): number { return this.itemReports.filter((r) => r.status === 'ACTION_TAKEN').length; }
  // ──────────────────────────────────────────────────────────────────────────

  get selectedModuleName(): string { return this.modules.find((m) => m.id === this.selectedModule())?.name ?? 'Dashboard'; }
  get selectedModuleIcon(): LucideIconData { return this.modules.find((m) => m.id === this.selectedModule())?.icon ?? ChartBar; }
  get mobileModules(): DashboardModule[] { return this.modules.slice(0, 5); }

  async logout(): Promise<void> {
    this.userService.logout();
    await this.router.navigate(['/']);
  }

  private loadMarketplaceCount(): void {
    this.furnitureService.getAll().subscribe({
      next: (items) => this.marketplaceCount.set((items || []).length),
      error: () => this.marketplaceCount.set(0),
    });
  }

  private loadAdminServices(): void {
    this.isLoadingServices.set(true);
    this.studentServicesApiService.getAdminServices(this.servicesModerationFilter()).subscribe({
      next: (services) => { this.services.set(services); this.isLoadingServices.set(false); },
      error: () => { this.toast.error('Unable to load services moderation right now.', 'Services Unavailable'); this.isLoadingServices.set(false); },
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
      this.toast.error('Unable to load platform signals right now.', 'Signals Unavailable');
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
      this.toast.error('Unable to load users right now.', 'Users Unavailable');
    } finally {
      this.isLoadingUsers.set(false);
    }
  }

  private setUserBusy(userId: number, busy: boolean): void {
    this.busyUserIds.update((ids) => busy ? [...ids, userId] : ids.filter((id) => id !== userId));
  }

  private preloadReporterNames(reports: ItemReportResponse[]): void {
    const uniqueIds = [...new Set((reports || []).map((r) => r.reporterUserId).filter((id) => !!id))];
    const unresolvedIds = uniqueIds.filter((id) => !this.reporterNames.has(id));
    if (unresolvedIds.length === 0) return;
    forkJoin(unresolvedIds.map((id) => this.userService.getProfileByUserId(id))).subscribe((profiles) => {
      profiles.forEach((p: UserProfileDto, i: number) => {
        const id = unresolvedIds[i];
        this.reporterNames.set(id, `${p?.firstName || p?.username || ''} ${p?.lastName || p?.lastname || ''}`.trim() || `User #${id}`);
      });
    });
  }

  private preloadOwnerNames(reports: ItemReportResponse[]): void {
    const uniqueIds = [...new Set((reports || []).map((r) => r.itemOwnerUserId).filter((id): id is number => !!id))];
    const unresolvedIds = uniqueIds.filter((id) => !this.ownerNames.has(id));
    if (unresolvedIds.length === 0) return;
    forkJoin(unresolvedIds.map((id) => this.userService.getProfileByUserId(id))).subscribe((profiles) => {
      profiles.forEach((p: UserProfileDto, i: number) => {
        const id = unresolvedIds[i];
        this.ownerNames.set(id, `${p?.firstName || p?.username || ''} ${p?.lastName || p?.lastname || ''}`.trim() || `User #${id}`);
      });
    });
  }

  private processBulkReview(status: 'REVIEWED' | 'ACTION_TAKEN', moderatorComment: string, actionLabel: 'reviewed' | 'blocked'): void {
    if (!this.isAdmin || this.bulkProcessing) return;
    const targets = this.itemReports.filter((r) => !!r.id && this.selectedReportIds.has(r.id) && this.isReportActionable(r));
    if (targets.length === 0) { this.toast.warning('Please select at least one OPEN report.'); return; }

    this.bulkProcessing = true;
    this.itemReportsError = '';

    forkJoin(
      targets.map((r) =>
        this.lostAndFoundService.reviewReport(r.id, { status, moderatorComment }).pipe(map(() => ({ ok: true })), catchError(() => of({ ok: false }))),
      ),
    ).subscribe((results) => {
      const successCount = results.filter((r) => r.ok).length;
      const failedCount = results.length - successCount;
      this.bulkProcessing = false;
      this.selectedReportIds.clear();
      if (failedCount === 0) {
        this.toast.success(`${successCount} report(s) ${actionLabel} successfully.`);
      } else if (successCount > 0) {
        this.toast.warning(`${successCount} report(s) ${actionLabel}, ${failedCount} failed.`);
      } else {
        this.toast.error('Failed to process selected reports.');
      }
      this.loadItemReports();
    });
  }
}
