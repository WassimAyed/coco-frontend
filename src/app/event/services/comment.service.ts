import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommentDto } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly baseUrl = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/comments`;

  constructor(private readonly http: HttpClient) {}

  add(payload: CommentDto): Observable<CommentDto> {
    return this.http.post<CommentDto>(this.baseUrl, payload);
  }

  update(id: number, payload: CommentDto): Observable<CommentDto> {
    return this.http.put<CommentDto>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByEvent(eventId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.baseUrl}/event/${eventId}`);
  }

  countByEvent(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/event/${eventId}/count`);
  }
}
