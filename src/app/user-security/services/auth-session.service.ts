import { Injectable, computed, signal } from '@angular/core';
import { AuthSession, UserProfile } from '../models/user.model';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../utils/auth-session.util';
import { getRoleHomeRoute } from '../utils/auth-route.util';
import { createAvatarDataUrl } from '../../shared/utils/avatar.util';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

function cloneSession(session: AuthSession): AuthSession {
  return {
    ...session,
    user: { ...session.user },
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly _session = signal<AuthSession | null>(null);
  private readonly _status = signal<AuthStatus>('idle');
  private readonly _error = signal<string | null>(null);

  /** In-memory session (cookie is persisted in parallel via save/clear helpers). */
  readonly session = computed(() => this._session());

  readonly currentUser = computed<UserProfile | null>(() => this._session()?.user ?? null);

  readonly isAuthenticated = computed(
    () => this._status() === 'authenticated' && !!this._session(),
  );

  readonly isLoading = computed(() => this._status() === 'loading');

  readonly error = computed(() => this._error());

  readonly homeRoute = computed(() => getRoleHomeRoute(this._session()));

  restoreFromCookie(): void {
    const stored = loadAuthSession();
    this._error.set(null);
    this._session.set(stored ? cloneSession(stored) : null);
    this._status.set(stored ? 'authenticated' : 'idle');
  }

  setLoading(): void {
    this._error.set(null);
    this._status.set('loading');
  }

  setSession(session: AuthSession): void {
    const next = cloneSession(session);
    saveAuthSession(next, next.rememberMe);
    this._session.set(next);
    this._error.set(null);
    this._status.set('authenticated');
  }

  setError(message: string): void {
    this._error.set(message);
    this._session.set(null);
    this._status.set('error');
  }

  clearError(): void {
    this._error.set(null);
    this._status.set(this._session() ? 'authenticated' : 'idle');
  }

  logout(): void {
    clearAuthSession();
    this._session.set(null);
    this._status.set('idle');
    this._error.set(null);
  }

  updateProfile(updates: Partial<UserProfile>): void {
    const session = this._session();
    if (!session) {
      return;
    }

    const firstName = updates.firstName ?? session.user.firstName;
    const lastName = updates.lastName ?? session.user.lastName;
    const nextSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        ...updates,
        avatarUrl: updates.avatarUrl ?? createAvatarDataUrl(`${firstName} ${lastName}`),
      },
    };

    saveAuthSession(nextSession, nextSession.rememberMe);
    this._session.set(nextSession);
    this._status.set('authenticated');
    this._error.set(null);
  }

  /** Bearer token from the live session signal (never a separate cookie read). */
  accessToken(): string | undefined {
    const token = this._session()?.accessToken?.trim();
    return token || undefined;
  }
}
