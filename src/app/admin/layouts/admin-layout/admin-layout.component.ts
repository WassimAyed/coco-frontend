<<<<<<< HEAD
import { AdminCouponsComponent } from '../../../coupon/components/admin-coupons/admin-coupons.component';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
=======
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
>>>>>>> 19cabf4ffa148b10a2c69b4d687f5e50e3050e75
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  Car,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  Filter,
  Home,
  LogOut,
  LucideIconData,
  MoreVertical,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  XCircle,
 MessageCircle,
  Gift
} from 'lucide-angular';
import { UserService } from '../../../user-security/services/user.service';
import { LostAndFoundService } from '../../../lost-found/services/lost-found.service';
import { ItemReportResponse } from '../../../lost-found/models/lost-item.model';
import { ToastService } from '../../../shared/services/toast.service';

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

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly lostAndFoundService = inject(LostAndFoundService);
  private readonly toast = inject(ToastService);

  readonly selectedModule = signal('overview');
  readonly searchQuery = signal('');
  readonly user = this.userService.currentUser;

  readonly modules: DashboardModule[] = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'item-reports', name: 'Item Reports', icon: AlertTriangle },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
    { id: 'fraud', name: 'Fraud Detection', icon: AlertTriangle },
    { id: 'carpooling', name: 'Carpooling', icon: Car },
    { id: 'colocation', name: 'Colocation', icon: Home },
    { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag },
    { id: 'services', name: 'Services', icon: Briefcase },
    { id: 'events', name: 'Events', icon: Calendar },
    { id: 'chat', name: 'Chat Moderation', icon: MessageCircle },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'coupons', name: 'Coupons', icon: Gift }
  ];

  readonly kpiCards = [
    {
      title: 'Total Users',
      value: '2,547',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Active Listings',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'text-blue-600'
    },
    {
      title: 'Monthly Revenue',
      value: '45,678 DT',
      change: '+23.1%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-green-600'
    },
    {
      title: 'Pending Approvals',
      value: '47',
      change: '-5.3%',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  readonly pendingUsers = [
    { id: 1, name: 'Ahmed Ben Ali', email: 'ahmed.benali@esprit.tn', phone: '+21620111222', registeredDate: '2026-03-15', status: 'pending' },
    { id: 2, name: 'Sarah Tounsi', email: 'sarah.tounsi@esprit.tn', phone: '+21622111333', registeredDate: '2026-03-16', status: 'pending' },
    { id: 3, name: 'Mohamed Karim', email: 'mohamed.karim@esprit.tn', phone: '+21623111444', registeredDate: '2026-03-17', status: 'pending' },
    { id: 4, name: 'Leila Mansour', email: 'leila.mansour@esprit.tn', phone: '+21624111555', registeredDate: '2026-03-17', status: 'pending' },
    { id: 5, name: 'Youssef Gharbi', email: 'youssef.gharbi@esprit.tn', phone: '+21625111666', registeredDate: '2026-03-18', status: 'pending' }
  ];

  readonly recentActivity = [
    { id: 1, user: 'Ahmed K.', action: 'Created carpooling offer', time: '5 min ago', type: 'carpooling', icon: Car },
    { id: 2, user: 'Sarah M.', action: 'Listed apartment for colocation', time: '12 min ago', type: 'colocation', icon: Home },
    { id: 3, user: 'Mohamed A.', action: 'Sold laptop on marketplace', time: '1 hour ago', type: 'marketplace', icon: ShoppingBag },
    { id: 4, user: 'Leila B.', action: 'Registered for event', time: '2 hours ago', type: 'event', icon: Calendar },
    { id: 5, user: 'Youssef T.', action: 'Subscribed to premium', time: '3 hours ago', type: 'subscription', icon: CreditCard }
  ];

  readonly fraudAlerts = [
    { id: 1, user: 'suspicious_user_123', reason: 'Multiple failed login attempts', severity: 'high', time: '10 min ago' },
    { id: 2, user: 'fake_listing_456', reason: 'Duplicate marketplace listings', severity: 'medium', time: '1 hour ago' },
    { id: 3, user: 'spam_account_789', reason: 'Spam messages detected', severity: 'high', time: '2 hours ago' }
  ];

  readonly SearchIcon = Search;
  readonly BellIcon = Bell;
  readonly ChevronDownIcon = ChevronDown;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly ClockIcon = Clock;
  readonly FilterIcon = Filter;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly EyeIcon = Eye;
  readonly DownloadIcon = Download;
  readonly UsersIcon = Users;
  readonly MoreVerticalIcon = MoreVertical;
  readonly UserIcon = User;
  readonly EditIcon = Edit;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;

  itemReports: ItemReportResponse[] = [];
  itemReportsLoading = false;
  itemReportsError = '';
  processingReportId: number | null = null;
  bulkProcessing = false;
  reporterNames = new Map<number, string>();
  ownerNames = new Map<number, string>();
  selectedReportIds = new Set<number>();

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const moduleId = params.get('module');
      if (moduleId && this.modules.some((module) => module.id === moduleId)) {
        this.selectModule(moduleId);
      }
    });
  }

  selectModule(moduleId: string): void {
    this.selectedModule.set(moduleId);

    if (moduleId === 'item-reports') {
      this.loadItemReports();
    }
  }

  loadItemReports(): void {
    this.itemReportsLoading = true;
    this.itemReportsError = '';

    this.lostAndFoundService.getReportsForModeration().subscribe({
      next: (reports) => {
        this.itemReports = (reports || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.selectedReportIds.clear();
        this.preloadReporterNames(this.itemReports);
        this.preloadOwnerNames(this.itemReports);
        this.itemReportsLoading = false;
      },
      error: (error) => {
        this.itemReportsError = error?.error?.message || 'Unable to load item reports.';
        this.itemReportsLoading = false;
      }
    });
  }

  keepReportedItem(report: ItemReportResponse): void {
    if (!this.isAdmin || !report?.id) return;

    this.processingReportId = report.id;
    this.lostAndFoundService.reviewReport(report.id, {
      status: 'REVIEWED',
      moderatorComment: 'Reviewed by admin. Item remains visible.'
    }).subscribe({
      next: () => {
        this.processingReportId = null;
        this.toast.success('Report marked as reviewed. Item kept visible.');
        this.loadItemReports();
      },
      error: () => {
        this.processingReportId = null;
        this.itemReportsError = 'Failed to mark report as reviewed.';
        this.toast.error('Failed to mark report as reviewed.');
      }
    });
  }

  blockReportedItem(report: ItemReportResponse): void {
    if (!this.isAdmin || !report?.id) return;

    this.processingReportId = report.id;
    this.lostAndFoundService.reviewReport(report.id, {
      status: 'ACTION_TAKEN',
      moderatorComment: 'Item blocked by admin after report review.'
    }).subscribe({
      next: () => {
        this.processingReportId = null;
        this.toast.warning('Item blocked successfully after report review.');
        this.loadItemReports();
      },
      error: () => {
        this.processingReportId = null;
        this.itemReportsError = 'Failed to block reported item.';
        this.toast.error('Failed to block reported item.');
      }
    });
  }

  isReportActionable(report: ItemReportResponse): boolean {
    return report.status === 'OPEN';
  }

  isReportSelected(reportId?: number): boolean {
    return !!reportId && this.selectedReportIds.has(reportId);
  }

  toggleReportSelection(report: ItemReportResponse, checked: boolean): void {
    if (!report?.id || !this.isReportActionable(report)) {
      return;
    }

    if (checked) {
      this.selectedReportIds.add(report.id);
      return;
    }

    this.selectedReportIds.delete(report.id);
  }

  toggleAllReportSelection(checked: boolean): void {
    if (!checked) {
      this.selectedReportIds.clear();
      return;
    }

    this.itemReports
      .filter((report) => this.isReportActionable(report) && !!report.id)
      .forEach((report) => this.selectedReportIds.add(report.id as number));
  }

  keepSelectedReports(): void {
    this.processBulkReview('REVIEWED', 'Reviewed by admin. Item remains visible.', 'reviewed');
  }

  blockSelectedReports(): void {
    this.processBulkReview('ACTION_TAKEN', 'Item blocked by admin after report review.', 'blocked');
  }

  get selectedReportsCount(): number {
    return this.selectedReportIds.size;
  }

  get allActionableSelected(): boolean {
    const actionable = this.itemReports.filter((report) => this.isReportActionable(report) && !!report.id);
    return actionable.length > 0 && actionable.every((report) => this.selectedReportIds.has(report.id as number));
  }

  openItemDetails(report: ItemReportResponse): void {
    if (!report?.itemId) return;
    this.router.navigate(['/lost-found/details', report.itemId], {
      queryParams: report.id ? { reportId: report.id } : undefined
    });
  }

  getReporterDisplayName(reporterUserId: number): string {
    if (!reporterUserId) {
      return 'Unknown user';
    }

    return this.reporterNames.get(reporterUserId) || `User #${reporterUserId}`;
  }

  getOwnerDisplayName(ownerUserId?: number | null): string {
    if (!ownerUserId) {
      return 'Unknown owner';
    }

    return this.ownerNames.get(ownerUserId) || `User #${ownerUserId}`;
  }

  get isAdmin(): boolean {
    const role = (this.user()?.role || '').toLowerCase();
    return role.includes('admin');
  }

  private preloadReporterNames(reports: ItemReportResponse[]): void {
    const uniqueIds = [...new Set((reports || []).map((r) => r.reporterUserId).filter((id) => !!id))];
    if (uniqueIds.length === 0) {
      return;
    }

    const unresolvedIds = uniqueIds.filter((id) => !this.reporterNames.has(id));
    if (unresolvedIds.length === 0) {
      return;
    }

    const requests = unresolvedIds.map((id) => this.userService.getProfileByUserId(id));
    forkJoin(requests).subscribe((profiles) => {
      profiles.forEach((profile: UserProfileDto, index: number) => {
        const id = unresolvedIds[index];
        const firstName = profile?.firstName || profile?.username || '';
        const lastName = profile?.lastName || profile?.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        this.reporterNames.set(id, fullName || `User #${id}`);
      });
    });
  }

  private preloadOwnerNames(reports: ItemReportResponse[]): void {
    const uniqueIds = [...new Set((reports || []).map((r) => r.itemOwnerUserId).filter((id): id is number => !!id))];
    if (uniqueIds.length === 0) {
      return;
    }

    const unresolvedIds = uniqueIds.filter((id) => !this.ownerNames.has(id));
    if (unresolvedIds.length === 0) {
      return;
    }

    const requests = unresolvedIds.map((id) => this.userService.getProfileByUserId(id));
    forkJoin(requests).subscribe((profiles) => {
      profiles.forEach((profile: UserProfileDto, index: number) => {
        const id = unresolvedIds[index];
        const firstName = profile?.firstName || profile?.username || '';
        const lastName = profile?.lastName || profile?.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        this.ownerNames.set(id, fullName || `User #${id}`);
      });
    });
  }

  private processBulkReview(
    status: 'REVIEWED' | 'ACTION_TAKEN',
    moderatorComment: string,
    actionLabel: 'reviewed' | 'blocked'
  ): void {
    if (!this.isAdmin || this.bulkProcessing) {
      return;
    }

    const targets = this.itemReports.filter(
      (report) => !!report.id && this.selectedReportIds.has(report.id) && this.isReportActionable(report)
    );

    if (targets.length === 0) {
      this.toast.warning('Please select at least one OPEN report.');
      return;
    }

    this.bulkProcessing = true;
    this.itemReportsError = '';

    const operations = targets.map((report) =>
      this.lostAndFoundService.reviewReport(report.id, { status, moderatorComment }).pipe(
        map(() => ({ ok: true })),
        catchError(() => of({ ok: false }))
      )
    );

    forkJoin(operations).subscribe((results) => {
      const successCount = results.filter((result) => result.ok).length;
      const failedCount = results.length - successCount;

      this.bulkProcessing = false;
      this.selectedReportIds.clear();

      if (failedCount === 0) {
        this.toast.success(`${successCount} report(s) ${actionLabel} successfully.`);
      } else if (successCount > 0) {
        this.toast.warning(`${successCount} report(s) ${actionLabel}, ${failedCount} failed.`);
      } else {
        this.toast.error(`Failed to process selected reports.`);
      }

      this.loadItemReports();
    });
  }

  get selectedModuleName(): string {
    return this.modules.find((module) => module.id === this.selectedModule())?.name ?? 'Dashboard';
  }

  get selectedModuleIcon(): LucideIconData {
    return this.modules.find((module) => module.id === this.selectedModule())?.icon ?? BarChart3;
  }

  get itemReportsBlockedCount(): number {
    return this.itemReports.filter((report) => report.itemStatus === 'BLOCKED').length;
  }

  get itemReportsReviewedCount(): number {
    return this.itemReports.filter((report) => report.status === 'REVIEWED').length;
  }

  get itemReportsActionTakenCount(): number {
    return this.itemReports.filter((report) => report.status === 'ACTION_TAKEN').length;
  }

  get mobileModules(): DashboardModule[] {
    return this.modules.slice(0, 5);
  }

  async logout(): Promise<void> {
    this.userService.logout();
    await this.router.navigate(['/']);
  }
}
