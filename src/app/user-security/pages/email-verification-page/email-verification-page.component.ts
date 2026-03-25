import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

const PENDING_VERIFICATION_EMAIL_KEY = 'pendingVerificationEmail';

@Component({
  selector: 'app-email-verification-page',
  templateUrl: './email-verification-page.component.html',
})
export class EmailVerificationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApiService = inject(AuthApiService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  readonly verificationEmail = signal('');
  readonly verificationToken = signal('');
  readonly isVerifying = signal(false);
  readonly isResendingLink = signal(false);
  readonly verificationSucceeded = signal(false);
  readonly verificationError = signal<string | null>(null);
  readonly statusMessage = signal(
    'We sent a verification link to your email. Open the link in your inbox to activate your account.',
  );

  constructor() {
    const queryParams = this.route.snapshot.queryParamMap;
    const emailFromQuery = queryParams.get('email')?.trim() ?? '';
    const tokenFromQuery = queryParams.get('token')?.trim() ?? '';
    const savedEmail = this.loadPersistedVerificationEmail();
    const resolvedEmail = emailFromQuery || savedEmail;

    this.verificationEmail.set(resolvedEmail);
    this.verificationToken.set(tokenFromQuery);

    if (resolvedEmail) {
      this.persistVerificationEmail(resolvedEmail);
    }

    if (resolvedEmail && tokenFromQuery) {
      void this.verifyEmailToken();
    }
  }

  resendVerificationLink(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isVerifying() || this.isResendingLink()) {
      return;
    }

    const email = this.verificationEmail().trim();
    if (!email) {
      this.verificationError.set(
        'Verification email is missing. Register again or open the email verification link.',
      );
      return;
    }

    this.verificationError.set(null);
    this.isResendingLink.set(true);

    void this.userService
      .resendVerificationCode({ email })
      .then((result) => {
        this.statusMessage.set(
          result.message ??
            'A new verification link has been sent to your email address.',
        );
        this.toastService.success(
          result.message ?? 'A new verification link has been sent.',
          'Verification Email Sent',
        );
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to resend the verification email right now.',
        );
        this.verificationError.set(message);
        this.toastService.error(message, 'Resend Failed');
      })
      .finally(() => {
        this.isResendingLink.set(false);
      });
  }

  private async verifyEmailToken(): Promise<void> {
    if (this.isVerifying()) {
      return;
    }

    const email = this.verificationEmail().trim();
    const token = this.verificationToken().trim();

    if (!email || !token) {
      return;
    }

    this.isVerifying.set(true);
    this.verificationError.set(null);
    this.statusMessage.set('We are verifying your email now...');

    try {
      const result = await this.userService.verifyEmail({
        email,
        token,
      });

      const message =
        result.message ?? 'Email verified successfully. You can now log in.';
      this.verificationSucceeded.set(true);
      this.statusMessage.set(message);
      this.clearPersistedVerificationEmail();
      this.toastService.success(message, 'Verification Complete');

      setTimeout(() => {
        void this.router.navigate(['/login'], {
          replaceUrl: true,
        });
      }, 1600);
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Verification failed. Request a new verification email.',
      );
      this.verificationError.set(message);
      this.statusMessage.set(
        'This verification link is invalid or expired. You can request a new one below.',
      );
      this.toastService.error(message, 'Verification Failed');
    } finally {
      this.isVerifying.set(false);
    }
  }

  private loadPersistedVerificationEmail(): string {
    try {
      return sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY)?.trim() ?? '';
    } catch {
      return '';
    }
  }

  private persistVerificationEmail(email: string): void {
    try {
      sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
    } catch {
      // Ignore storage issues and rely on query params.
    }
  }

  private clearPersistedVerificationEmail(): void {
    try {
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
    } catch {
      // Ignore storage issues.
    }
  }
}
