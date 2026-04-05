import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';
import { UserService } from '../../services/user.service';

const PENDING_TWO_FACTOR_KEY = 'pendingTwoFactorLogin';
const MAX_TWO_FACTOR_ATTEMPTS = 3;

interface PendingTwoFactorContext {
  email: string;
  rememberMe: boolean;
}

@Component({
  standalone: false,
  selector: 'app-two-factor-page',
  templateUrl: './two-factor-page.component.html',
})
export class TwoFactorPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authApiService = inject(AuthApiService);
  private readonly userService = inject(UserService);

  readonly email = signal('');
  readonly rememberMe = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly isResending = signal(false);
  readonly attempts = signal(0);
  readonly remainingAttempts = computed(
    () => MAX_TWO_FACTOR_ATTEMPTS - this.attempts(),
  );
  readonly hasAttemptsLeft = computed(() => this.remainingAttempts() > 0);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    const context = this.loadPendingContext();
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
    const resolvedEmail = emailFromQuery || context?.email || '';

    this.email.set(resolvedEmail);
    this.rememberMe.set(context?.rememberMe ?? false);
  }

  submit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isSubmitting() || this.isResending()) {
      return;
    }

    if (!this.email()) {
      this.submitError.set('2FA email is missing. Please sign in again.');
      return;
    }

    if (!this.hasAttemptsLeft()) {
      this.submitError.set(
        'You used all 3 attempts. Please resend a new 2FA code.',
      );
      return;
    }

    this.form.markAllAsTouched();
    this.userService.clearError();
    this.submitError.set(null);

    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    void this.userService
      .verifyTwoFactor(
        {
          email: this.email(),
          code: this.form.controls.code.value,
        },
        this.rememberMe(),
      )
      .then(async (result) => {
        this.clearPendingContext();
        this.toastService.success(
          result.message ?? 'Signed in successfully.',
          '2FA Verified',
        );
        await this.router.navigate([
          result.session?.user.role === 'admin' ? '/admin' : '/profile',
        ]);
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to verify the 2FA code right now.',
        );

        this.attempts.update((value) =>
          Math.min(value + 1, MAX_TWO_FACTOR_ATTEMPTS),
        );

        if (message.toLowerCase().includes('maximum')) {
          this.attempts.set(MAX_TWO_FACTOR_ATTEMPTS);
        }

        const remaining = this.remainingAttempts();
        this.submitError.set(
          remaining > 0
            ? `${message} ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
            : 'You used all 3 attempts. Please resend a new 2FA code.',
        );
        this.toastService.error(message, '2FA Failed');
      })
      .finally(() => {
        this.isSubmitting.set(false);
      });
  }

  resendCode(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isSubmitting() || this.isResending()) {
      return;
    }

    if (!this.email()) {
      this.submitError.set('2FA email is missing. Please sign in again.');
      return;
    }

    this.submitError.set(null);
    this.isResending.set(true);

    void this.userService
      .resendTwoFactorCode({ email: this.email() })
      .then((result) => {
        this.form.controls.code.reset();
        this.attempts.set(0);
        this.toastService.success(
          result.message ?? 'A new 2FA code has been sent to your email.',
          '2FA Code Sent',
        );
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to resend the 2FA code right now.',
        );
        this.submitError.set(message);
        this.toastService.error(message, 'Resend Failed');
      })
      .finally(() => {
        this.isResending.set(false);
      });
  }

  keepDigitsOnly(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const normalizedValue = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = normalizedValue;
    this.form.controls.code.setValue(normalizedValue);
  }

  private loadPendingContext(): PendingTwoFactorContext | null {
    try {
      const raw = sessionStorage.getItem(PENDING_TWO_FACTOR_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as PendingTwoFactorContext;
      if (!parsed.email?.trim()) {
        return null;
      }

      return {
        email: parsed.email.trim(),
        rememberMe: !!parsed.rememberMe,
      };
    } catch {
      return null;
    }
  }

  private clearPendingContext(): void {
    try {
      sessionStorage.removeItem(PENDING_TWO_FACTOR_KEY);
    } catch {
      // Ignore storage issues.
    }
  }
}

