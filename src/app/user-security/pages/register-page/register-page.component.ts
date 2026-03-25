import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

const PENDING_VERIFICATION_EMAIL_KEY = 'pendingVerificationEmail';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApiService = inject(AuthApiService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    agreeToTerms: [false, Validators.requiredTrue],
  });

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  get passwordsMatch(): boolean {
    return (
      this.form.controls.password.value ===
      this.form.controls.confirmPassword.value
    );
  }

  submit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isSubmitting()) {
      return;
    }

    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (this.form.invalid || !this.passwordsMatch) {
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      email: this.form.controls.email.value.trim(),
      username: this.form.controls.firstName.value.trim(),
      lastname: this.form.controls.lastName.value.trim(),
      password: this.form.controls.password.value,
      confirmPassword: this.form.controls.confirmPassword.value,
    };

    void this.userService
      .register(payload)
      .then(async (result) => {
        this.toastService.success(
          result.message ?? 'Account created successfully.',
          'Registration Sent',
        );
        this.persistVerificationEmail(payload.email);

        await this.router.navigate(['/verify-email']);
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to create the account right now.',
        );
        this.submitError.set(message);
        this.toastService.error(message, 'Registration Failed');
      })
      .finally(() => {
        this.isSubmitting.set(false);
      });
  }

  private persistVerificationEmail(email: string): void {
    try {
      sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
    } catch {
      // Ignore storage issues and rely on route state/query params.
    }
  }
}
