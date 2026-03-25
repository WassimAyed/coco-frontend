import { AuthSession, UserProfile } from '../models/user.model';

export function getRoleHomeRoute(userOrSession: UserProfile | AuthSession | null | undefined): string {
  const role = !userOrSession
    ? null
    : 'user' in userOrSession
      ? userOrSession.user.role
      : userOrSession.role;

  return role === 'admin' ? '/admin' : '/profile';
}
