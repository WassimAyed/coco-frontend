import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private baseUrl = 'http://localhost:8094/api/reviews';
  constructor(private http: HttpClient) {}

  create(review: Review): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, review);
  }

  getByFurniture(furnitureId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/furniture/${furnitureId}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
