import { Component, inject, signal } from '@angular/core';
import { computed } from '@angular/core';
import { Menu, X } from 'lucide-angular';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  selector: 'app-public-layout',
  templateUrl: './public-layout.component.html'
})
export class PublicLayoutComponent {
  private readonly userService = inject(UserService);

  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly mobileMenuOpen = signal(false);
  readonly isAuthenticated = this.userService.isAuthenticated;
  readonly homeRoute = this.userService.homeRoute;
  readonly homeLabel = computed(() => (this.userService.currentUser()?.role === 'admin' ? 'Admin Dashboard' : 'Display Profile'));

  toggleMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
