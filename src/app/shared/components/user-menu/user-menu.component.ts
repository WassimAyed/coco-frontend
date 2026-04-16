import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChevronDown, LogOut, UserRound, Clipboard } from 'lucide-angular';
import { UserService } from '../../../user-security/services/user.service';
import { Home, Briefcase, FileText, Search, Calendar, Car } from 'lucide-angular';
@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html'
})
export class UserMenuComponent {


  readonly HomeIcon = Home;
  readonly BriefcaseIcon = Briefcase;
  readonly FileTextIcon = FileText;
  readonly SearchIcon = Search;
  readonly CalendarIcon = Calendar;
  readonly CarIcon = Car;

  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly ChevronDownIcon = ChevronDown;
  readonly UserRoundIcon = UserRound;
  readonly LogOutIcon = LogOut;

  // New icons for your routes
  readonly MesOffresIcon = Clipboard;
  readonly MesOffresRequestIcon = Clipboard;

  readonly menuOpen = signal(false);
  /** Direct reference to session user signal (same source as login / landing). */
  readonly user = this.userService.currentUser;
  readonly homeRoute = this.userService.homeRoute;
  readonly homeLabel = computed(() =>
    this.user()?.role === 'admin' ? 'Admin Dashboard' : 'Display Profile',
  );

  // New routes
  readonly mesOffresRoute = '/collocation/mesOffres';
  readonly mesOffresRequestRoute = '/collocation/mesOffresRequest';
  readonly myEventsRoute = '/event/my-events';
  readonly participatedEventsRoute = '/event/participated-events';

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
