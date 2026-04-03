import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { LoginCredentials, UserProfile } from '../models/user.model';
import { AuthStoreState, authStore } from '../state/auth.store';
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

import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authApiService = inject(AuthApiService);
  private readonly userApiService = inject(UserApiService);
  private readonly snapshot = signal<AuthStoreState>(authStore.getState());

  readonly state = computed(() => this.snapshot());
  readonly session = computed(() => this.snapshot().session);
  readonly currentUser = computed<UserProfile | null>(() => this.snapshot().session?.user ?? null);
  readonly isAuthenticated = computed(() => this.snapshot().status === 'authenticated' && !!this.snapshot().session);
  readonly isLoading = computed(() => this.snapshot().status === 'loading');
  readonly error = computed(() => this.snapshot().error);
  readonly homeRoute = computed(() => getRoleHomeRoute(this.snapshot().session));

  private readonly http = inject(HttpClient);

  constructor() {
    const unsubscribe = authStore.subscribe((state) => {
      this.snapshot.set(state);
    });

    this.destroyRef.onDestroy(unsubscribe);
  }

  restoreSession(): void {
    authStore.getState().restoreSession();
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    authStore.getState().setLoading();

    try {
      const result = await this.authApiService.login(credentials);
      if (result.session) {
        authStore.getState().setSession(result.session);
      } else {
        authStore.getState().clearError();
      }
      return result;
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(error, 'Unable to sign in right now.');
      authStore.getState().setError(message);
      throw error;
    }
  }

  register(payload: RegisterPayload): Promise<RegisterResult> {
    return this.authApiService.register(payload);
  }

  verifyEmail(payload: VerifyEmailPayload): Promise<MessageResponse> {
    return this.authApiService.verifyEmail(payload);
  }

  async verifyTwoFactor(payload: VerifyTwoFactorPayload, rememberMe: boolean): Promise<LoginResult> {
    authStore.getState().setLoading();

    try {
      const result = await this.authApiService.verifyTwoFactor(payload, rememberMe);
      if (result.session) {
        authStore.getState().setSession(result.session);
      }
      return result;
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(error, 'Unable to verify the 2FA code right now.');
      authStore.getState().setError(message);
      throw error;
    }
  }

  resendVerificationCode(payload: ResendVerificationCodePayload): Promise<MessageResponse> {
    return this.authApiService.resendVerificationCode(payload);
  }

  resendTwoFactorCode(payload: ResendVerificationCodePayload): Promise<MessageResponse> {
    return this.authApiService.resendTwoFactorCode(payload);
  }

  completeOAuthLogin(accessToken: string, refreshToken?: string, rememberMe = true): void {
    const result = this.authApiService.buildSessionFromTokens(
      accessToken,
      refreshToken,
      rememberMe,
    );

    if (result.session) {
      authStore.getState().setSession(result.session);
    }
  }

  async loadCurrentUserProfile(): Promise<UserProfile> {
    const currentUser = this.currentUser();
    const profile = await this.userApiService.getCurrentUser(
      this.currentUser()?.email ?? '',
    );
    const resolvedProfile: UserProfile = {
      ...profile,
      avatarUrl: profile.avatarUrl || currentUser?.avatarUrl || '',
      firstName: profile.firstName || currentUser?.firstName || '',
      lastName: profile.lastName || currentUser?.lastName || '',
      twoFactorEnabled:
        profile.twoFactorEnabled ?? currentUser?.twoFactorEnabled ?? false,
    };
    authStore.getState().updateProfile(resolvedProfile);
    return resolvedProfile;
  }

  async saveCurrentUserProfile(payload: UserUpdatePayload): Promise<UserProfile> {
    const currentUser = this.currentUser();
    const profile = await this.userApiService.updateCurrentUser(
      payload,
      this.currentUser()?.email ?? '',
    );
    const resolvedProfile: UserProfile = {
      ...profile,
      avatarUrl:
        payload.imageUrl.trim() || profile.avatarUrl || currentUser?.avatarUrl || '',
      firstName:
        payload.username.trim() || profile.firstName || currentUser?.firstName || '',
      lastName:
        payload.lastname.trim() || profile.lastName || currentUser?.lastName || '',
      twoFactorEnabled:
        profile.twoFactorEnabled ?? currentUser?.twoFactorEnabled ?? false,
    };
    authStore.getState().updateProfile(resolvedProfile);
    return resolvedProfile;
  }

  updatePasswordRequest(payload: PasswordUpdatePayload): Promise<void> {
    return this.userApiService.updatePassword(payload);
  }

  async setTwoFactorEnabled(payload: ToggleTwoFactorPayload): Promise<MessageResponse> {
    const result = await this.userApiService.setTwoFactorEnabled(payload);
    authStore.getState().updateProfile({
      twoFactorEnabled: payload.enabled,
    });
    return result;
  }

  getHomeRoute(): string {
    return getRoleHomeRoute(this.snapshot().session);
  }

  updateProfile(profileUpdates: Partial<UserProfile>): void {
    authStore.getState().updateProfile(profileUpdates);
  }

 logout(): void {

  authStore.getState().logout();
  this.snapshot.set(authStore.getState());
}

  clearError(): void {
    authStore.getState().clearError();
  }


  checkProfileExists(userId: number) {
  return this.http.get<boolean>(`http://localhost:8090/profiles/exists/${userId}`);
}

// ✅ Matching API call
findMatches(userId: number) {
  return this.http.get<any[]>(`http://localhost:8090/match/${userId}`);
}

}
