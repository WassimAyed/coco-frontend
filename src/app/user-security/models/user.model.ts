export interface UserStat {
  label: string;
  value: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: 'student' | 'admin';
  twoFactorEnabled?: boolean;
  department: string;
  academicLevel: string;
  campus: string;
  bio: string;
  highlights: string[];
  stats: UserStat[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthSession {
  accessToken?: string;
  user: UserProfile;
  rememberMe: boolean;
  refreshToken?: string;
  authenticatedAt: string;
}
