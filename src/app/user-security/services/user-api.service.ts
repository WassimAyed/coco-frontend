import { HttpClient } from '@angular/common/http';
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
        withCredentials: environment.auth.withCredentials,
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
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return buildAuthSessionFromApiResponse(response, false, emailHint).user;
  }

  updatePassword(payload: PasswordUpdatePayload): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(joinUrl(environment.apiBaseUrl, '/users/me/password'), payload, {
        withCredentials: environment.auth.withCredentials,
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
          withCredentials: environment.auth.withCredentials,
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

  async getUserById(id: string): Promise<UserProfile> {
    const response = await firstValueFrom(
      this.http.get<unknown>(joinUrl(environment.apiBaseUrl, `/users/${id}`), {
        withCredentials: environment.auth.withCredentials,
      }),
    );

    return response as UserProfile;
  }
}
