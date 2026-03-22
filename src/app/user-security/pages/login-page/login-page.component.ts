import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../../environments/environment';

const PENDING_TWO_FACTOR_KEY = 'pendingTwoFactorLogin';
const USER_ID_KEY = 'userId'; // new key for storing user ID

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  readonly showPassword = signal(false);
  readonly isLoading = this.userService.isLoading;
  readonly authError = computed(() => this.userService.error());

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  get emailError(): string | null {
    const control = this.form.controls.email;

    if (!control.touched) return null;
    if (control.hasError('required')) return 'Email is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';

    return null;
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.userService.clearError();
    this.clearPendingTwoFactorContext();

    if (this.emailError || this.form.invalid) {
      return;
    }

    try {
      const result = await this.userService.login(this.form.getRawValue());

      // ===== TWO FACTOR =====
      if (result.requiresTwoFactor) {
        const email =
          result.twoFactorEmail ?? this.form.controls.email.value.trim();

        this.persistPendingTwoFactorContext(
          email,
          this.form.controls.rememberMe.value
        );

        this.toastService.info(
          result.message ?? 'A 2FA code has been sent to your email address.',
          'Two-Factor Authentication'
        );

        await this.router.navigate(['/login/2fa'], {
          queryParams: { email },
        });
        return;
      }

      // ===== SESSION CHECK =====
      if (!result.session) {
        this.toastService.error(
          result.message ?? 'Unable to complete sign in.',
          'Login Failed'
        );
        return;
      }

      // ✅ STORE USER IN LOCAL STORAGE
      this.storeUserAndId(result.session.user);

      // (optional) store token if exists
      // this.userService.storeToken(result.session.token);

      this.toastService.success(
        result.message ?? 'Signed in successfully.',
        'Login Success'
      );

      // ===== REDIRECT =====
      await this.router.navigate([
        result.session.user.role === 'admin' ? '/admin' : '/profile',
      ]);
    } catch {
      const errorMessage = this.authError();

      if (errorMessage) {
        this.toastService.error(errorMessage, 'Login Failed');
      }
    }
  }

  startGoogleLogin(): void {
    const authBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
    const googlePath = environment.auth.googleLoginPath.startsWith('/')
      ? environment.auth.googleLoginPath
      : `/${environment.auth.googleLoginPath}`;

    window.location.href = `${authBaseUrl}${googlePath}`;
  }

  private persistPendingTwoFactorContext(email: string, rememberMe: boolean): void {
    try {
      sessionStorage.setItem(PENDING_TWO_FACTOR_KEY, JSON.stringify({ email, rememberMe }));
    } catch {}
  }

  private clearPendingTwoFactorContext(): void {
    try {
      sessionStorage.removeItem(PENDING_TWO_FACTOR_KEY);
    } catch {}
  }


  private storeUserAndId(user: any): void {
    try {
      // store the full user object
      this.userService.storeUser(user);

      // store only the user ID in localStorage
      localStorage.setItem("userId", user.id);
    } catch (e) {
      console.error('Failed to store user or userId', e);
    }
  }

  /** Retrieve user ID anywhere in your app */
  getStoredUserId(): string | null {
    try {
      return localStorage.getItem(USER_ID_KEY);
    } catch {
      return null;
    }
  }

  /** Clear user ID on logout */
  clearStoredUserId(): void {
    try {
      localStorage.removeItem(USER_ID_KEY);
    } catch {}
  }
}
