import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { authStore } from '../../user-security/state/auth.store';
import { loadAuthSession } from '../../user-security/utils/auth-session.util';
import { AdminSignal } from '../models/admin-signal.model';

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function asAdminSignal(value: unknown): AdminSignal {
  const record = value as Record<string, unknown>;

  return {
    createdAt:
      typeof record['createdAt'] === 'string' ? record['createdAt'] : null,
    description: String(record['description'] ?? ''),
    id: Number(record['id'] ?? 0),
    imageUrl: typeof record['imageUrl'] === 'string' ? record['imageUrl'] : null,
    userId: Number(record['userId'] ?? 0),
    username: String(record['username'] ?? ''),
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminSignalApiService {
  private readonly http = inject(HttpClient);

  async getAllSignals(): Promise<AdminSignal[]> {
    const response = await firstValueFrom(
      this.http.get<unknown[]>(joinUrl(environment.apiBaseUrl, '/signals'), {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return Array.isArray(response) ? response.map(asAdminSignal) : [];
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
