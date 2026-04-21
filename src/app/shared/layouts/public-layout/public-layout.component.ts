import { Component, inject, signal, computed } from '@angular/core';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-angular';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  standalone: false,
  selector: 'app-public-layout',
  templateUrl: './public-layout.component.html'
})
export class PublicLayoutComponent {

  private readonly userService = inject(UserService);

  // Icons
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly MenuIcon = Menu;
  readonly XIcon = X;

  // Signals
  readonly mobileMenuOpen = signal(false);
  readonly featuresDropdownOpen = signal(false);
  readonly featuresDropdownMobileOpen = signal(false);

  // Auth
  readonly isAuthenticated = this.userService.isAuthenticated;
  readonly homeRoute = this.userService.homeRoute;

  readonly homeLabel = computed(() =>
    this.userService.currentUser()?.role === 'admin'
      ? 'Admin Dashboard'
      : 'Display Profile'
  );

  // ===== MENU =====
  toggleMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.mobileMenuOpen.set(false);
  }

  // ===== DESKTOP DROPDOWN =====
  toggleFeaturesDropdown() {
    this.featuresDropdownOpen.update(v => !v);
  }

  closeFeaturesDropdown() {
    this.featuresDropdownOpen.set(false);
  }

  // ===== MOBILE DROPDOWN =====
  toggleFeaturesDropdownMobile() {
    this.featuresDropdownMobileOpen.update(v => !v);
  }
}

