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

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
  stats?: Array<{ label: string; value: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  /** LOGIN */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.loginPath),
        { email: credentials.email.trim(), password: credentials.password },
        { withCredentials: environment.auth.withCredentials }
      )
    );

    const record = response && typeof response === 'object' ? response as Record<string, unknown> : null;
    const message = record && typeof record['message'] === 'string' ? record['message'] : undefined;
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

  /** REGISTER */
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.registerPath),
        payload,
        { withCredentials: environment.auth.withCredentials }
      )
    );

    return this.extractMessageResponse(response);
  }

  /** VERIFY EMAIL */
  async verifyEmail(payload: VerifyEmailPayload): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.verifyEmailPath),
        payload,
        { withCredentials: environment.auth.withCredentials }
      )
    );

    return this.extractMessageResponse(response);
  }

  /** VERIFY TWO-FACTOR */
  async verifyTwoFactor(payload: VerifyTwoFactorPayload, rememberMe: boolean): Promise<LoginResult> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.verifyTwoFactorPath),
        payload,
        { withCredentials: environment.auth.withCredentials }
      )
    );

    const record = response && typeof response === 'object' ? response as Record<string, unknown> : null;

    return {
      message: record && typeof record['message'] === 'string' ? record['message'] : undefined,
      session: buildAuthSessionFromApiResponse(response, rememberMe, payload.email)
    };
  }

  /** RESEND VERIFICATION CODE */
  async resendVerificationCode(payload: ResendVerificationCodePayload): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.resendVerificationCodePath),
        payload,
        { withCredentials: environment.auth.withCredentials }
      )
    );

    return this.extractMessageResponse(response);
  }

  /** RESEND TWO-FACTOR CODE */
  async resendTwoFactorCode(payload: ResendVerificationCodePayload): Promise<MessageResponse> {
    const response = await firstValueFrom(
      this.http.post<unknown>(
        joinUrl(environment.apiBaseUrl, environment.auth.resendTwoFactorCodePath),
        payload,
        { withCredentials: environment.auth.withCredentials }
      )
    );

    return this.extractMessageResponse(response);
  }

  /** GET USER PROFILE */
  async getUserProfile(): Promise<UserProfile> {
    return await firstValueFrom(
      this.http.get<UserProfile>(joinUrl(environment.apiBaseUrl, '/user/profile'), {
        withCredentials: environment.auth.withCredentials
      })
    );
  }

  /** UPDATE USER PROFILE */
  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return await firstValueFrom(
      this.http.put<UserProfile>(joinUrl(environment.apiBaseUrl, '/user/profile'), profile, {
        withCredentials: environment.auth.withCredentials
      })
    );
  }

  /** BUILD SESSION FROM TOKENS */
  buildSessionFromTokens(accessToken: string, refreshToken: string | undefined, rememberMe: boolean): LoginResult {
    const response = { accessToken, refreshToken };
    return { session: buildAuthSessionFromApiResponse(response, rememberMe, '') };
  }

  /** EXTRACT ERROR MESSAGE */
  extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;

      if (typeof payload === 'string' && payload.trim()) return payload;

      if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        for (const key of ['message', 'error', 'detail']) {
          const value = record[key];
          if (typeof value === 'string' && value.trim()) return value;
        }

        const fieldErrors = record['fieldErrors'];
        if (fieldErrors && typeof fieldErrors === 'object') {
          const firstFieldError = Object.values(fieldErrors as Record<string, unknown>)
            .find((v) => typeof v === 'string' && v.trim());
          if (typeof firstFieldError === 'string') return firstFieldError;
        }
      }

      if (error.message) return error.message;
    }

    if (error instanceof Error && error.message.trim()) return error.message;

    return fallback;
  }

  /** PRIVATE - EXTRACT GENERIC MESSAGE RESPONSE */
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
