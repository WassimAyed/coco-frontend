import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { hasValidAuthToken } from '../utils/auth-token.util';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (!hasValidAuthToken()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
