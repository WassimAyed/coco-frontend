import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReactionDto, ReactionSummaryDto } from '../models/reaction.model';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private readonly baseUrl = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/reactions`;

  constructor(private readonly http: HttpClient) {}

  addOrUpdate(payload: ReactionDto): Observable<ReactionDto> {
    return this.http.post<ReactionDto>(this.baseUrl, payload);
  }

  remove(eventId: number, authorEmail: string): Observable<void> {
    const params = new HttpParams().set('authorEmail', authorEmail);
    return this.http.delete<void>(`${this.baseUrl}/event/${eventId}`, { params });
  }

  getSummary(eventId: number): Observable<ReactionSummaryDto> {
    return this.http.get<ReactionSummaryDto>(`${this.baseUrl}/event/${eventId}/summary`);
  }
}
