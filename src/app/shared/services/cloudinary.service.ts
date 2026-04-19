import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  cloudName = 'demo';
  uploadPreset = 'default';

  getOptimizedUrl(urlOrId: string, width = 400, height = 280): string {
    if (!urlOrId) return '';
    if (urlOrId.startsWith('http')) return urlOrId;
    return 'https://res.cloudinary.com/' + this.cloudName + '/image/upload/w_' + width + ',h_' + height + '/' + urlOrId;
  }

  uploadWidget(onSuccess: (secureUrl: string) => void): void {
    console.log('Cloudinary upload widget - demo mode');
  }
}