import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChevronDown, LogOut, UserRound } from 'lucide-angular';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html'
})
export class UserMenuComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly ChevronDownIcon = ChevronDown;
  readonly UserRoundIcon = UserRound;
  readonly LogOutIcon = LogOut;
  readonly menuOpen = signal(false);
  readonly user = computed(() => this.userService.currentUser());
  readonly homeRoute = this.userService.homeRoute;
  readonly homeLabel = computed(() => (this.user()?.role === 'admin' ? 'Admin Dashboard' : 'Display Profile'));

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.userService.logout();
    this.closeMenu();
    await this.router.navigate(['/']);
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.closeMenu();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
