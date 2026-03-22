import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { LoginCredentials, UserProfile } from '../models/user.model';
import { AuthStoreState, authStore } from '../state/auth.store';
import { getRoleHomeRoute } from '../utils/auth-route.util';
import {
  LoginResult,
  MessageResponse,
  RegisterPayload,
  RegisterResult,
  ResendVerificationCodePayload,
  VerifyEmailPayload,
  VerifyTwoFactorPayload,
} from '../models/auth-api.model';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authApiService = inject(AuthApiService);
  private readonly snapshot = signal<AuthStoreState>(authStore.getState());

  readonly state = computed(() => this.snapshot());
  readonly session = computed(() => this.snapshot().session);
  readonly currentUser = computed<UserProfile | null>(() => this.snapshot().session?.user ?? null);
  readonly isAuthenticated = computed(() => this.snapshot().status === 'authenticated' && !!this.snapshot().session);
  readonly isLoading = computed(() => this.snapshot().status === 'loading');
  readonly error = computed(() => this.snapshot().error);
  readonly homeRoute = computed(() => getRoleHomeRoute(this.snapshot().session));

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

  getHomeRoute(): string {
    return getRoleHomeRoute(this.snapshot().session);
  }

  updateProfile(profileUpdates: Partial<UserProfile>): void {
    authStore.getState().updateProfile(profileUpdates);
  }

  logout(): void {
    authStore.getState().logout();
  }

  clearError(): void {
    authStore.getState().clearError();
  }


  private readonly USER_KEY = 'currentUser';

storeUser(user: any): void {
  try {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to store user', e);
  }
}

getStoredUser(): any | null {
  try {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

clearStoredUser(): void {
  localStorage.removeItem(this.USER_KEY);
}

}
