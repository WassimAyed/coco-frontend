import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ShareResponse {
  shareUrl: string;
}

interface ShareSummaryResponse {
  totalShares: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly baseUrl = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/shares`;

  constructor(private readonly http: HttpClient) {}

  shareEvent(eventId: number): Observable<ShareResponse> {
    return this.http.post<ShareResponse>(this.baseUrl, {
      eventId,
      platform: 'FACEBOOK'
    });
  }

  getSummary(eventId: number): Observable<ShareSummaryResponse> {
    return this.http.get<ShareSummaryResponse>(`${this.baseUrl}/event/${eventId}/summary`);
  }
}
