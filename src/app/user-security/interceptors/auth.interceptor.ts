import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../services/auth-session.service';

const AUTH_PATH_MARKERS = [
  environment.auth.loginPath,
  environment.auth.registerPath,
  environment.auth.verifyEmailPath,
  environment.auth.resendVerificationCodePath,
  environment.auth.verifyTwoFactorPath,
  environment.auth.resendTwoFactorCodePath,
  environment.auth.googleLoginPath,
].map((p) => (p.startsWith('/') ? p : `/${p}`));

function isPublicAuthRequest(url: string): boolean {
  try {
    const path = new URL(url, 'http://local.invalid').pathname;
    return AUTH_PATH_MARKERS.some((marker) => path.includes(marker));
  } catch {
    return AUTH_PATH_MARKERS.some((marker) => url.includes(marker));
  }
}

function isDisabledAccountError(error: HttpErrorResponse): boolean {
  const payload = error.error;
  const msg = (
    typeof payload?.message === 'string' ? payload.message :
    typeof payload?.error === 'string' ? payload.error :
    typeof payload === 'string' ? payload : ''
  ).toLowerCase();
  return msg.includes('disabled') || msg.includes('suspended');
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isPublicAuthRequest(req.url)) {
      return next.handle(req);
    }

    const token = this.authSession.accessToken();
    if (!token) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 403 && isDisabledAccountError(error)) {
          this.router.navigate(['/account-disabled']);
        }
        return throwError(() => error);
      }),
    );
  }
}
