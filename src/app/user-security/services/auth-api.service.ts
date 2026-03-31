import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginCredentials } from '../models/user.model';
import {
  LoginResult,
  MessageResponse,
  RegisterPayload,
  RegisterResult,
  ResendVerificationCodePayload,
  VerifyEmailPayload,
  VerifyTwoFactorPayload,
} from '../models/auth-api.model';
import { buildAuthSessionFromApiResponse } from '../utils/user-profile.util';

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  async getCurrentUserProfile(): Promise<Record<string, unknown> | null> {
    const response = await firstValueFrom(
      this.http.get<unknown>(
        joinUrl(environment.apiBaseUrl, '/users/me'),
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    if (response && typeof response === 'object') {
      return response as Record<string, unknown>;
    }

    return null;
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.loginPath),
        {
          email: credentials.email.trim(),
          password: credentials.password
        },
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    const record = response && typeof response === 'object'
      ? response as Record<string, unknown>
      : null;
    const message = record && typeof record['message'] === 'string'
      ? record['message']
      : undefined;
    const requiresTwoFactor = record?.['requiresTwoFactor'] === true;

    if (requiresTwoFactor) {
      return {
        message,
        requiresTwoFactor: true,
        twoFactorEmail: credentials.email.trim(),
      };
    }

    return {
      message,
      session: buildAuthSessionFromApiResponse(response, credentials.rememberMe, credentials.email)
    };
  }

  async register(payload: RegisterPayload): Promise<RegisterResult> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.registerPath),
        payload,
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    return this.extractMessageResponse(response);
  }

  async verifyEmail(payload: VerifyEmailPayload): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.verifyEmailPath),
        payload,
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    return this.extractMessageResponse(response);
  }

  async verifyTwoFactor(payload: VerifyTwoFactorPayload, rememberMe: boolean): Promise<LoginResult> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.verifyTwoFactorPath),
        payload,
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    const record = response && typeof response === 'object'
      ? response as Record<string, unknown>
      : null;

    return {
      message: record && typeof record['message'] === 'string'
        ? record['message']
        : undefined,
      session: buildAuthSessionFromApiResponse(response, rememberMe, payload.email)
    };
  }

  async resendVerificationCode(payload: ResendVerificationCodePayload): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.resendVerificationCodePath),
        payload,
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    return this.extractMessageResponse(response);
  }

  async resendTwoFactorCode(payload: ResendVerificationCodePayload): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.resendTwoFactorCodePath),
        payload,
        {
          withCredentials: environment.auth.withCredentials
        }
      )
    );

    return this.extractMessageResponse(response);
  }

  extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;

      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }

      if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;

        for (const key of ['message', 'error', 'detail']) {
          const value = record[key];
          if (typeof value === 'string' && value.trim()) {
            return value;
          }
        }

        const fieldErrors = record['fieldErrors'];
        if (fieldErrors && typeof fieldErrors === 'object') {
          const firstFieldError = Object.values(
            fieldErrors as Record<string, unknown>
          ).find((value) => typeof value === 'string' && value.trim());

          if (typeof firstFieldError === 'string' && firstFieldError.trim()) {
            return firstFieldError;
          }
        }
      }

      if (error.message) {
        return error.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }

  buildSessionFromTokens(accessToken: string, refreshToken: string | undefined, rememberMe: boolean): LoginResult {
    const response = {
      accessToken,
      refreshToken,
    };

    return {
      session: buildAuthSessionFromApiResponse(response, rememberMe, ''),
    };
  }

  private extractMessageResponse(response: unknown): MessageResponse {
    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;

      return {
        message: typeof record['message'] === 'string' ? record['message'] : undefined,
        status: typeof record['status'] === 'string' ? record['status'] : undefined
      };
    }

    return {};
  }
}
