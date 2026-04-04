import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileRequestDTO } from '../models/ProfileRequest.model';
import { MatchResultDTO } from '../models/MatchResult.model';


@Injectable({
  providedIn: 'root'
})
export class MatchingService {
  private readonly API_URL = 'http://localhost:8090/api/matchingColloc';

  constructor(private http: HttpClient) {}

  match(user: ProfileRequestDTO, candidates: ProfileRequestDTO[]): Observable<MatchResultDTO[]> {
    const payload = {
      user,
      candidates
    };
    return this.http.post<MatchResultDTO[]>(this.API_URL, payload);
  }
}
