import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loadAuthSession } from '../utils/auth-session.util';
import { UserSignal } from '../models/profile-shell.model';

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function asSignal(value: unknown): UserSignal {
  const record = value as Record<string, unknown>;
  return {
    id: Number(record['id'] ?? 0),
    description: String(record['description'] ?? ''),
    imageUrl: typeof record['imageUrl'] === 'string' ? record['imageUrl'] : null,
    userId: Number(record['userId'] ?? 0),
    username: String(record['username'] ?? ''),
    createdAt: typeof record['createdAt'] === 'string' ? record['createdAt'] : null,
  };
}

@Injectable({
  providedIn: 'root',
})
export class SignalApiService {
  private readonly http = inject(HttpClient);

  async getMySignals(): Promise<UserSignal[]> {
    const response = await firstValueFrom(
      this.http.get<unknown[]>(joinUrl(environment.apiBaseUrl, '/signals/me'), {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return Array.isArray(response) ? response.map(asSignal) : [];
  }

  async createSignal(description: string, image?: File | null): Promise<UserSignal> {
    const formData = new FormData();
    formData.append('description', description.trim());
    if (image) {
      formData.append('image', image);
    }

    const response = await firstValueFrom(
      this.http.post<unknown>(joinUrl(environment.apiBaseUrl, '/signals'), formData, {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return asSignal(response);
  }

  async updateSignal(signalId: number, description: string, image?: File | null): Promise<UserSignal> {
    const formData = new FormData();
    formData.append('description', description.trim());
    if (image) {
      formData.append('image', image);
    }

    const response = await firstValueFrom(
      this.http.put<unknown>(joinUrl(environment.apiBaseUrl, `/signals/${signalId}`), formData, {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return asSignal(response);
  }

  async deleteSignal(signalId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(joinUrl(environment.apiBaseUrl, `/signals/${signalId}`), {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.auth.withCredentials,
      }),
    );
  }

  private getAuthorizationHeaders(): HttpHeaders {
    const session = loadAuthSession();
    const accessToken = session?.accessToken?.trim();
    return accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : new HttpHeaders();
  }
}
