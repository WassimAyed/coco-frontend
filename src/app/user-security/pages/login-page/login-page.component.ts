import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly showPassword = signal(false);

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

  submit(): void {
    this.form.markAllAsTouched();
    if (this.emailError || this.form.invalid) {
      return;
    }
  }
}
