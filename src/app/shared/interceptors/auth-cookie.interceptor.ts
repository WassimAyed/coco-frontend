import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loadAuthSession } from '../../user-security/utils/auth-session.util';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

@Injectable()
export class AuthCookieInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const apiBaseUrl = normalizeBaseUrl(environment.apiBaseUrl);
    const requestUrl = request.url.trim();

    if (!requestUrl.startsWith(apiBaseUrl)) {
      return next.handle(request);
    }

    if (request.headers.has('Authorization')) {
      return next.handle(request);
    }

    const accessToken = loadAuthSession()?.accessToken?.trim();
    if (!accessToken) {
      return next.handle(request);
    }

    return next.handle(
      request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
  }
}
