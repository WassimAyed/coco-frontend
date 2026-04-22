import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {

  private scriptLoaded = false;
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.scriptLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
