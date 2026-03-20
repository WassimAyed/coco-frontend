import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { AuthSession, LoginCredentials, UserProfile } from '../models/user.model';
import { AuthStoreState, authStore } from '../state/auth.store';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly snapshot = signal<AuthStoreState>(authStore.getState());

  readonly state = computed(() => this.snapshot());
  readonly session = computed(() => this.snapshot().session);
  readonly currentUser = computed<UserProfile | null>(() => this.snapshot().session?.user ?? null);
  readonly isAuthenticated = computed(() => this.snapshot().status === 'authenticated' && !!this.snapshot().session);
  readonly isLoading = computed(() => this.snapshot().status === 'loading');
  readonly error = computed(() => this.snapshot().error);

  constructor() {
    const unsubscribe = authStore.subscribe((state) => {
      this.snapshot.set(state);
    });

    this.destroyRef.onDestroy(unsubscribe);
  }

  restoreSession(): void {
    authStore.getState().restoreSession();
  }

  login(credentials: LoginCredentials): Promise<AuthSession> {
    return authStore.getState().login(credentials);
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
}
