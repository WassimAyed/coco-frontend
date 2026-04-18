import { HttpInterceptorFn } from '@angular/common/http';
import { getAuthToken } from '../utils/auth-token.util';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
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
    return next(request);
  }

  return next(request.clone({ setHeaders: headers }));
};