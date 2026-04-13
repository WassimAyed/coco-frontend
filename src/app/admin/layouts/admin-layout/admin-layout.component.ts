import { AdminCouponsComponent } from '../../../coupon/components/admin-coupons/admin-coupons.component';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly userService = inject(UserService);

  readonly selectedModule = signal('overview');
  readonly searchQuery = signal('');
  readonly user = this.userService.currentUser;

  readonly modules: DashboardModule[] = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'User Management', icon: Users },
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

  selectModule(moduleId: string): void {
    this.selectedModule.set(moduleId);
  }

  get selectedModuleName(): string {
    return this.modules.find((module) => module.id === this.selectedModule())?.name ?? 'Dashboard';
  }

  get selectedModuleIcon(): LucideIconData {
    return this.modules.find((module) => module.id === this.selectedModule())?.icon ?? BarChart3;
  }

  get mobileModules(): DashboardModule[] {
    return this.modules.slice(0, 5);
  }

  async logout(): Promise<void> {
    this.userService.logout();
    await this.router.navigate(['/']);
  }
}
