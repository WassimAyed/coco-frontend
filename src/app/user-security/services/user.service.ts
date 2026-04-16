import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginCredentials, UserProfile } from '../models/user.model';
import { getRoleHomeRoute } from '../utils/auth-route.util';
import {
  LoginResult,
  MessageResponse,
  PasswordUpdatePayload,
  RegisterPayload,
  RegisterResult,
  ResendVerificationCodePayload,
  ToggleTwoFactorPayload,
  UserUpdatePayload,
  VerifyEmailPayload,
  VerifyTwoFactorPayload,
} from '../models/auth-api.model';
import { AuthApiService } from './auth-api.service';
import { UserApiService } from './user-api.service';
import { AuthSessionService } from './auth-session.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly authSession = inject(AuthSessionService);
  private readonly authApiService = inject(AuthApiService);
  private readonly userApiService = inject(UserApiService);
  private readonly http = inject(HttpClient);

  private readonly profileCache = new Map<number, any>();

  readonly currentUser = this.authSession.currentUser;
  readonly session = this.authSession.session;
  readonly isAuthenticated = this.authSession.isAuthenticated;
  readonly isLoading = this.authSession.isLoading;
  readonly error = this.authSession.error;
  readonly homeRoute = this.authSession.homeRoute;

  /**
   * Old builds stored JWT in localStorage and a global profile flag; that breaks
   * cookie-based session and shows the wrong user/banner after account switch.
   */
  clearLegacyBrowserAuthCaches(): void {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('profileCompleted');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('coco_profile_ok_')) {
          keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore private mode / quota
    }
  }

  restoreSession(): void {
    this.authSession.restoreFromCookie();
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    this.authSession.setLoading();

    try {
      // Best-effort: clear any existing backend HTTP session to avoid sticky account switch.
      try {
        await this.authApiService.logoutSession();
      } catch {
        // Ignore when no server session exists.
      }

      const result = await this.authApiService.login(credentials);

      if (result.session) {
        this.clearLegacyBrowserAuthCaches();
        this.profileCache.clear();
        this.authSession.setSession(result.session);
      } else {
        this.authSession.clearError();
      }

      return result;
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to sign in right now.',
      );
      this.authSession.setError(message);
      throw error;
    }
  }

  register(payload: RegisterPayload): Promise<RegisterResult> {
    return this.authApiService.register(payload);
  }

  verifyEmail(payload: VerifyEmailPayload): Promise<MessageResponse> {
    return this.authApiService.verifyEmail(payload);
  }

  async verifyTwoFactor(
    payload: VerifyTwoFactorPayload,
    rememberMe: boolean,
  ): Promise<LoginResult> {
    this.authSession.setLoading();

    try {
      const result = await this.authApiService.verifyTwoFactor(payload, rememberMe);

      if (result.session) {
        this.clearLegacyBrowserAuthCaches();
        this.profileCache.clear();
        this.authSession.setSession(result.session);
      }

      return result;
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to verify the 2FA code right now.',
      );
      this.authSession.setError(message);
      throw error;
    }
  }

  resendVerificationCode(payload: ResendVerificationCodePayload) {
    return this.authApiService.resendVerificationCode(payload);
  }

  resendTwoFactorCode(payload: ResendVerificationCodePayload) {
    return this.authApiService.resendTwoFactorCode(payload);
  }

  completeOAuthLogin(
    accessToken: string,
    refreshToken?: string,
    rememberMe = true,
  ): void {
    const result = this.authApiService.buildSessionFromTokens(
      accessToken,
      refreshToken,
      rememberMe,
    );

    if (result.session) {
      this.clearLegacyBrowserAuthCaches();
      this.profileCache.clear();
      this.authSession.setSession(result.session);
    }
  }

  async loadCurrentUserProfile(): Promise<UserProfile> {
    const currentUser = this.currentUser();

    const profile = await this.userApiService.getCurrentUser(currentUser?.email ?? '');

    const resolvedProfile: UserProfile = {
      ...profile,
      avatarUrl: profile.avatarUrl || currentUser?.avatarUrl || '',
      firstName: profile.firstName || currentUser?.firstName || '',
      lastName: profile.lastName || currentUser?.lastName || '',
      twoFactorEnabled:
        profile.twoFactorEnabled ?? currentUser?.twoFactorEnabled ?? false,
    };

    this.authSession.updateProfile(resolvedProfile);

    return resolvedProfile;
  }

  async saveCurrentUserProfile(payload: UserUpdatePayload): Promise<UserProfile> {
    const currentUser = this.currentUser();

    const profile = await this.userApiService.updateCurrentUser(
      payload,
      currentUser?.email ?? '',
    );

    const resolvedProfile: UserProfile = {
      ...profile,
      avatarUrl: payload.imageUrl.trim() || profile.avatarUrl || currentUser?.avatarUrl || '',
      firstName: payload.username.trim() || profile.firstName || currentUser?.firstName || '',
      lastName: payload.lastname.trim() || profile.lastName || currentUser?.lastName || '',
      twoFactorEnabled:
        profile.twoFactorEnabled ?? currentUser?.twoFactorEnabled ?? false,
    };

    this.authSession.updateProfile(resolvedProfile);

    return resolvedProfile;
  }

  updatePasswordRequest(payload: PasswordUpdatePayload) {
    return this.userApiService.updatePassword(payload);
  }

  async setTwoFactorEnabled(payload: ToggleTwoFactorPayload) {
    const result = await this.userApiService.setTwoFactorEnabled(payload);

    this.authSession.updateProfile({
      twoFactorEnabled: payload.enabled,
    });

    return result;
  }

  getHomeRoute(): string {
    return getRoleHomeRoute(this.authSession.session());
  }

  updateProfile(profileUpdates: Partial<UserProfile>): void {
    this.authSession.updateProfile(profileUpdates);
  }

  logout(): void {
    const clearLocal = () => {
      this.authSession.logout();
      this.profileCache.clear();
      this.clearLegacyBrowserAuthCaches();
    };

    this.authApiService.logoutSession()
      .catch(() => {
        // Ignore server logout errors; local logout must still happen.
      })
      .finally(clearLocal);
  }

  setCurrentSession(session: unknown): void {
    if (!session) {
      this.profileCache.clear();
    }
  }

  clearError(): void {
    this.authSession.clearError();
  }

  currentSession() {
    return this.authSession.session();
  }

  checkProfileExists(userId: number) {
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    return this.http.get<boolean>(`${base}/profiles/exists/${userId}`, {
      withCredentials: environment.auth.withCredentials,
    });
  }

  getProfileByUserId(userId: number) {
    if (this.profileCache.has(userId)) {
      return of(this.profileCache.get(userId));
    }

    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    return this.http.get<any>(`${base}/users/${userId}`, {
      withCredentials: environment.auth.withCredentials,
    }).pipe(
      tap((profile) => this.profileCache.set(userId, profile)),
      catchError(() => of(null)),
    );
  }
}
