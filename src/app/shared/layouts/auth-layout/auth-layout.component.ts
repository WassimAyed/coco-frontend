import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../components/logo/logo.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet, LogoComponent],
  templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent {}
