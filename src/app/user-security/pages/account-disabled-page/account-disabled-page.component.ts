import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ShieldOff } from 'lucide-angular';
import { UserService } from '../../services/user.service';

@Component({
  standalone: false,
  selector: 'app-account-disabled-page',
  templateUrl: './account-disabled-page.component.html',
})
export class AccountDisabledPageComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly ShieldOffIcon = ShieldOff;

  goToLogin(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
