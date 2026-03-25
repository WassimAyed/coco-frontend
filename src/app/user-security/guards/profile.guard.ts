import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const profileGuard: CanActivateFn = () => {
  const router = inject(Router);
  const userService = inject(UserService);
  const user = userService.currentUser();

  if (!userService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return user?.role === 'student' ? true : router.createUrlTree([userService.getHomeRoute()]);
};
