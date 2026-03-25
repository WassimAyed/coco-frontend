import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MessageResponse,
  PasswordUpdatePayload,
  ToggleTwoFactorPayload,
  UserUpdatePayload,
} from '../models/auth-api.model';
import { UserProfile } from '../models/user.model';
import { loadAuthSession } from '../utils/auth-session.util';
import { buildAuthSessionFromApiResponse } from '../utils/user-profile.util';

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly http = inject(HttpClient);

  async getCurrentUser(emailHint = ''): Promise<UserProfile> {
    const response = await firstValueFrom(
      this.http.get<unknown>(joinUrl(environment.apiBaseUrl, '/users/me'), {
        ...this.getAuthorizedOptions(),
      }),
    );

    return buildAuthSessionFromApiResponse(response, false, emailHint).user;
  }

  async updateCurrentUser(
    payload: UserUpdatePayload,
    emailHint = '',
  ): Promise<UserProfile> {
    const response = await firstValueFrom(
      this.http.put<unknown>(joinUrl(environment.apiBaseUrl, '/users/me'), payload, {
        ...this.getAuthorizedOptions(),
      }),
    );

    return buildAuthSessionFromApiResponse(response, false, emailHint).user;
  }

  updatePassword(payload: PasswordUpdatePayload): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(joinUrl(environment.apiBaseUrl, '/users/me/password'), payload, {
        ...this.getAuthorizedOptions(),
      }),
    );
  }

  async setTwoFactorEnabled(
    payload: ToggleTwoFactorPayload,
  ): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.put<unknown>(
        joinUrl(environment.apiBaseUrl, '/users/me/two-factor'),
        payload,
        {
          ...this.getAuthorizedOptions(),
        },
      ),
    );

    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      return {
        message:
          typeof record['message'] === 'string' ? record['message'] : undefined,
        status:
          typeof record['status'] === 'string' ? record['status'] : undefined,
      };
    }

    return {};
  }

  private getAuthorizedOptions(): {
    headers: HttpHeaders;
    withCredentials: boolean;
  } {
    const session = loadAuthSession();
    const accessToken = session?.accessToken?.trim();
    const headers = accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : new HttpHeaders();

    return {
      headers,
      withCredentials: environment.auth.withCredentials,
    };
  }
}
