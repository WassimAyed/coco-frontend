import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminModule } from './admin/admin.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { UserSecurityModule } from './user-security/user-security.module';
import { UserService } from './user-security/services/user.service';
import { AuthCookieInterceptor } from './shared/interceptors/auth-cookie.interceptor';



@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [BrowserModule, CommonModule, HttpClientModule, RouterModule, LucideAngularModule, AppRoutingModule, AdminModule, SharedModule, UserSecurityModule],
  providers: [
    {
      multi: true,
      provide: HTTP_INTERCEPTORS,
      useClass: AuthCookieInterceptor
    },
    {
      deps: [UserService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: (userService: UserService) => () => userService.restoreSession()
    }
  ]
})
export class AppModule {}
