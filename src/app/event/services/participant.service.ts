import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParticipantDto } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private readonly baseUrl = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/participants`;

  constructor(private readonly http: HttpClient) {}

  getByEvent(eventId: number): Observable<ParticipantDto[]> {
    return this.http.get<ParticipantDto[]>(`${this.baseUrl}/event/${eventId}`);
  }
}
