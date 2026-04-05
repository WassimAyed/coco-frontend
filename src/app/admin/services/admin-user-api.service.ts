import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { authStore } from '../../user-security/state/auth.store';
import { loadAuthSession } from '../../user-security/utils/auth-session.util';
import { AdminUser } from '../models/admin-user.model';

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function asAdminUser(value: unknown): AdminUser {
  const record = value as Record<string, unknown>;

  return {
    email: String(record['email'] ?? ''),
    enabled:
      typeof record['enabled'] === 'boolean' ? record['enabled'] : undefined,
    id: Number(record['id'] ?? 0),
    imageUrl: typeof record['imageUrl'] === 'string' ? record['imageUrl'] : '',
    lastname: String(record['lastname'] ?? ''),
    role: String(record['role'] ?? 'USER'),
    twoFactorEnabled: Boolean(record['twoFactorEnabled'] ?? false),
    username: String(record['username'] ?? ''),
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminUserApiService {
  private readonly http = inject(HttpClient);

  async getAllUsers(): Promise<AdminUser[]> {
    const response = await firstValueFrom(
      this.http.get<unknown[]>(joinUrl(environment.apiBaseUrl, '/admin/users'), {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return Array.isArray(response) ? response.map(asAdminUser) : [];
  }

  disableUser(userId: number): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(
        joinUrl(environment.apiBaseUrl, `/admin/users/${userId}/disable`),
        {},
        {
          headers: this.getAuthorizationHeaders(),
          withCredentials: environment.auth.withCredentials,
        },
      ),
    );
  }

  enableUser(userId: number): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(
        joinUrl(environment.apiBaseUrl, `/admin/users/${userId}/enable`),
        {},
        {
          headers: this.getAuthorizationHeaders(),
          withCredentials: environment.auth.withCredentials,
        },
      ),
    );
  }

  private getAuthorizationHeaders(): HttpHeaders {
    const cookieSession = loadAuthSession();
    const storeSession = authStore.getState().session;
    const accessToken =
      cookieSession?.accessToken?.trim() || storeSession?.accessToken?.trim();

    return accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : new HttpHeaders();
  }
}
