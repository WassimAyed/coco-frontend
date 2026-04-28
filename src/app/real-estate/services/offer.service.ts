import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offer } from '../models/offer.model';

@Injectable({ providedIn: 'root' })
export class OfferService {
  private baseUrl = 'http://localhost:8094/api/offers';

  constructor(private http: HttpClient) {}

  create(offer: Offer): Observable<Offer> {
    return this.http.post<Offer>(this.baseUrl, offer);
  }

  getAll(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.baseUrl);
  }

  getByFurniture(furnitureId: number): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.baseUrl}/furniture/${furnitureId}`);
  }

  getByBuyer(buyerId: number): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.baseUrl}/buyer/${buyerId}`);
  }

  accept(id: number): Observable<Offer> {
    return this.http.put<Offer>(`${this.baseUrl}/${id}/accept`, {});
  }

  reject(id: number): Observable<Offer> {
    return this.http.put<Offer>(`${this.baseUrl}/${id}/reject`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}