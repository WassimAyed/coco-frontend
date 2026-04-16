import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EventRatingDto } from '../models/event-rating.model';

@Injectable({
  providedIn: 'root'
})
export class EventRatingService {
  private readonly baseUrl = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/ratings`;

  constructor(private readonly http: HttpClient) {}

  rate(payload: EventRatingDto): Observable<EventRatingDto> {
    return this.http.post<EventRatingDto>(this.baseUrl, payload);
  }

  getStats(eventId: number): Observable<EventRatingDto> {
    return this.http.get<EventRatingDto>(`${this.baseUrl}/event/${eventId}/stats`);
  }

  getUserRating(eventId: number, userId: number): Observable<EventRatingDto | null> {
    return this.http.get<EventRatingDto>(`${this.baseUrl}/event/${eventId}/user/${userId}`).pipe(
      catchError(() => of(null))
    );
  }
}