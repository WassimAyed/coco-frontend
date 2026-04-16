import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../user-security/services/user.service';

export const lostFoundAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const userService = inject(UserService);

  if (!userService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const user = userService.currentUser();
  if (user?.id) {
    localStorage.setItem('userId', String(user.id));
  }
  if (user?.role) {
    const role = user.role.toLowerCase() === 'admin' ? 'ADMIN' : user.role.toUpperCase();
    localStorage.setItem('role', role);
  }

  return true;
};
