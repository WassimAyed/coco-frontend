import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Menu, X } from 'lucide-angular';
import { LogoComponent } from '../../components/logo/logo.component';
import { UserService } from '../../../user-security/services/user.service';
import { UserMenuComponent } from '../../components/user-menu/user-menu.component';
import { AmbientBackgroundComponent } from '../../components/ambient-background/ambient-background.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, LogoComponent, LucideAngularModule, UserMenuComponent, AmbientBackgroundComponent],
  templateUrl: './public-layout.component.html'
})
export class PublicLayoutComponent {
  private readonly userService = inject(UserService);

  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly mobileMenuOpen = signal(false);
  readonly isAuthenticated = this.userService.isAuthenticated;

  toggleMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
