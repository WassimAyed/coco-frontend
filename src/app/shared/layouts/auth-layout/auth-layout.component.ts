import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../components/logo/logo.component';
import { AmbientBackgroundComponent } from '../../components/ambient-background/ambient-background.component';
import { AuthSplashCursorComponent } from '../../components/auth-splash-cursor/auth-splash-cursor.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet, LogoComponent, AmbientBackgroundComponent, AuthSplashCursorComponent],
  templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent {}
