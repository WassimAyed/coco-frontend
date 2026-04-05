import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../services/user.service';

@Component({
  standalone: false,
  selector: 'app-oauth-callback-page',
  templateUrl: './oauth-callback-page.component.html',
})
export class OauthCallbackPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  readonly errorMessage = signal<string | null>(null);

  constructor() {
    void this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    const queryParams = this.route.snapshot.queryParamMap;
    const accessToken = queryParams.get('accessToken')?.trim() ?? '';
    const refreshToken = queryParams.get('refreshToken')?.trim() ?? '';
    const error = queryParams.get('error')?.trim() ?? '';
    const message = queryParams.get('message')?.trim() ?? '';

    if (error || message) {
      this.errorMessage.set(message || error || 'Google login failed.');
      this.toastService.error(
        message || error || 'Google login failed.',
        'Google Login Failed',
      );
      return;
    }

    if (!accessToken) {
      this.errorMessage.set(
        'Missing OAuth token. Please try Google sign-in again.',
      );
      return;
    }

    await this.userService.completeOAuthLogin(
      accessToken,
      refreshToken || undefined,
    );
    this.toastService.success('Signed in with Google successfully.', 'Google Login');
    void this.router.navigate([this.userService.getHomeRoute()]);
  }
}

