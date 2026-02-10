import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http'; // <-- new way

import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      {
        path: 'collocation',
        loadChildren: () => import('./app/collocation/collocation.module').then(m => m.CollocationModule)
      },
      { path: '', redirectTo: 'collocation/create-offer', pathMatch: 'full' },
      { path: '**', redirectTo: 'collocation/create-offer' }
    ]),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule)
  ]
});
