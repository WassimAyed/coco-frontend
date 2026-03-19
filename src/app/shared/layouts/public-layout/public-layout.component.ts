import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Menu, X } from 'lucide-angular';
import { LogoComponent } from '../../components/logo/logo.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, LogoComponent, LucideAngularModule],
  templateUrl: './public-layout.component.html'
})
export class PublicLayoutComponent {
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly mobileMenuOpen = signal(false);

  toggleMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
