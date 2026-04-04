import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../../environments/environment';

const PENDING_TWO_FACTOR_KEY = 'pendingTwoFactorLogin';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  // ================= SIGNALS =================
  readonly showPassword = signal(false);
  readonly isLoading = this.userService.isLoading;
  readonly authError = computed(() => this.userService.error());

  // ================= FORM =================
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  // ================= UI =================
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  get emailError(): string | null {
    const control = this.form.controls.email;
    if (!control.touched) return null;
    if (control.hasError('required')) return 'Email is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    return null;
  }

  // ================= LOGIN =================
  async submit(): Promise<void> {
    this.clearPendingTwoFactorContext();

    this.form.markAllAsTouched();
    this.userService.clearError();

    if (this.form.invalid || this.emailError) return;

    try {
      const result = await this.userService.login(this.form.getRawValue());
      console.log('Login response processed:', result);

      // ================= TWO FACTOR =================
      if (result.requiresTwoFactor) {
        const email = result.twoFactorEmail ?? this.form.controls.email.value.trim();
        this.persistPendingTwoFactorContext(email, this.form.controls.rememberMe.value);
        this.toastService.info(
          result.message ?? 'A 2FA code has been sent to your email.',
          'Two-Factor Authentication'
        );
        await this.router.navigate(['/login/2fa'], { queryParams: { email } });
        return;
      }

      // ================= SESSION VALIDATION =================
      if (!result.session) {
        this.toastService.error(
          result.message ?? 'Unable to complete sign in.',
          'Login Failed'
        );
        return;
      }

      // ================= STORE SESSION IN MEMORY =================
      this.userService.setCurrentSession(result.session); // <-- store token and user in memory

      // ================= LOAD CURRENT USER PROFILE =================
      await this.userService.loadCurrentUserProfile();

      this.toastService.success(
        result.message ?? 'Signed in successfully.',
        'Login Success'
      );

      // ================= REDIRECT =================
      const homeRoute = this.userService.getHomeRoute() || '/';
      await this.router.navigate([homeRoute]);

    } catch (error) {
      const message = this.authError();
      if (message) this.toastService.error(message, 'Login Failed');
      console.error('Login error:', error);
    }
  }

  // ================= GOOGLE LOGIN =================
  startGoogleLogin(): void {
    const authBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
    const googlePath = environment.auth.googleLoginPath.startsWith('/')
      ? environment.auth.googleLoginPath
      : `/${environment.auth.googleLoginPath}`;

    this.toastService.info('Redirecting to Google sign-in...', 'Google Authentication');
    window.location.assign(`${authBaseUrl}${googlePath}`);
  }

  // ================= TWO FACTOR STORAGE =================
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
}
