import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  LucideIconData,
  MessageCircle,
  Settings,
  Shield,
  Users,
} from 'lucide-angular';

export type AdminDashboardModuleId =
  | 'overview'
  | 'users'
  | 'signals'
  | 'services'
  | 'roles'
  | 'chat'
  | 'analytics'
  | 'settings';

export interface AdminDashboardModule {
  id: AdminDashboardModuleId;
  name: string;
  icon: LucideIconData;
}

export const ADMIN_DASHBOARD_MODULES: AdminDashboardModule[] = [
  { id: 'overview', name: 'Overview', icon: BarChart3 },
  { id: 'users', name: 'User Management', icon: Users },
  { id: 'signals', name: 'Signals', icon: AlertTriangle },
  { id: 'services', name: 'Services', icon: Briefcase },
  { id: 'roles', name: 'Roles & Permissions', icon: Shield },
  { id: 'chat', name: 'Chat Moderation', icon: MessageCircle },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
];
