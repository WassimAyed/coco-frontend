import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { getAuthToken } from '../utils/auth-token.util';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = getAuthToken();
    const hasBody = request.body !== null && request.body !== undefined;
    const isFormData = typeof FormData !== 'undefined' && request.body instanceof FormData;

    const headers: Record<string, string> = {};

    if (token && !request.headers.has('Authorization')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (hasBody && !isFormData && !request.headers.has('Content-Type')) {
      headers['Content-Type'] = 'application/json';
    }

    if (Object.keys(headers).length === 0) {
      return next.handle(request);
    }

    return next.handle(request.clone({ setHeaders: headers }));
  }
}
