import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../../user-security/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class SmartCollocationService {

  private apiUrl = 'http://localhost:9092/api/collocation';
  private readonly userService = inject(UserService);

  constructor(private http: HttpClient) { }

  getRecommendations(userId?: number): Observable<number[]> {
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');
    return this.http.get<number[]>(`${this.apiUrl}/smart/recommendations/${id}`);
  }

  getApplicantRanking(offerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/smart/ranking/${offerId}`);
  }

  getTrustScore(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/smart/trust-score/${userId}`);
  }

  predictPrice(requestParams: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/smart/predict-price`, requestParams);
  }
}
