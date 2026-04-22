import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BehaviorDto } from '../models/behavior.model';

@Injectable({ providedIn: 'root' })
export class BehaviorService {
  private readonly api = `${environment.eventApiBaseUrl.replace(/\/api\/events$/, '')}/api/behavior`;

  constructor(private readonly http: HttpClient) {}

  record(payload: BehaviorDto): Observable<void> {
    return this.http.post<void>(this.api, payload);
  }
}
