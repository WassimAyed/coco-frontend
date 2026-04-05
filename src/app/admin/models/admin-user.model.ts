export interface AdminUser {
  id: number;
  username: string;
  lastname: string;
  email: string;
  imageUrl: string;
  role: string;
  twoFactorEnabled: boolean;
  enabled?: boolean;
}
