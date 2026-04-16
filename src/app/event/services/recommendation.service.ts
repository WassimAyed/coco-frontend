import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/paged-response.model';
import { ScoredEvent } from '../models/scored-event.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly api = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/events/recommended`;

  constructor(private readonly http: HttpClient) {}

  getRecommended(userId: number, page = 0, size = 9): Observable<PagedResponse<ScoredEvent>> {
    return this.http.get<PagedResponse<ScoredEvent>>(`${this.api}/${userId}?page=${page}&size=${size}`);
  }
}
