import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SharedModule } from '../shared/shared.module';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { UserProfilePageComponent } from './pages/user-profile-page/user-profile-page.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserSecurityRoutingModule } from './user-security-routing.module';

@NgModule({
  declarations: [LoginPageComponent, RegisterPageComponent, UserListComponent, UserProfilePageComponent],
  exports: [LoginPageComponent, RegisterPageComponent, UserListComponent, UserProfilePageComponent],
  imports: [
    CommonModule,
    LucideAngularModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    UserSecurityRoutingModule
  ]
})
export class UserSecurityModule { }
