import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../../environments/environment';

const PENDING_TWO_FACTOR_KEY = 'pendingTwoFactorLogin';
const USER_ID_KEY = 'userId';
const ACCESS_TOKEN_KEY = 'accessToken';

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

      // Log the full response to help debug
      console.log('Login response:', result);

      // ===== TWO FACTOR =====
      if (result.requiresTwoFactor) {
        const email = result.twoFactorEmail ?? this.form.controls.email.value.trim();
        this.persistPendingTwoFactorContext(email, this.form.controls.rememberMe.value);
        this.toastService.info(
          result.message ?? 'A 2FA code has been sent to your email address.',
          'Two-Factor Authentication'
        );
        await this.router.navigate(['/login/2fa'], { queryParams: { email } });
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

      // Extract token from common locations
      const token = (result as any).token
                 || (result as any).accessToken
                 || (result.session as any)?.token
                 || (result.session as any)?.accessToken;

      if (token) {
        // Token‑based authentication
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        console.log('Token stored for subsequent API calls.');
      } else {
        // Cookie‑based authentication – no token stored
        console.warn('No token in response – assuming cookie‑based authentication.');
        // Store a flag to indicate the user is logged in (optional)
        localStorage.setItem('isAuthenticated', 'true');
      }

      // Store user ID (always needed)
      localStorage.setItem(USER_ID_KEY, result.session.user.id);

      this.toastService.success(
        result.message ?? 'Signed in successfully.',
        'Login Success'
      );

      // Redirect to landing page
      await this.router.navigate(['/']);
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
    this.toastService.info('Redirecting to Google sign-in...', 'Google Authentication');
    window.location.assign(`${authBaseUrl}${googlePath}`);
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

  /** Clear all user data on logout */
  clearStoredUserData(): void {
    try {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('profileCompleted');
    } catch {}
  }
}
