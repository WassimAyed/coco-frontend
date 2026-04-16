import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authSession = inject(AuthSessionService);

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
    );
  }
}
