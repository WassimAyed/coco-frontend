import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppLoadingComponent } from '../../../shared/components/app-loading/app-loading.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AppLoadingComponent],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly showPassword = signal(false);
  readonly isLoading = this.userService.isLoading;
  readonly authError = computed(() => this.userService.error());

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  get emailError(): string | null {
    const control = this.form.controls.email;
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Email is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    if (!control.value.endsWith('@esprit.tn')) {
      return 'Use your ESPRIT email address.';
    }
    return null;
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.userService.clearError();

    if (this.emailError || this.form.invalid) {
      return;
    }

    try {
      await this.userService.login(this.form.getRawValue());
      await this.router.navigate(['/profile']);
    } catch {
      return;
    }
  }
}
