import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../../user-security/services/user.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollocationService {

  private apiUrl = `${environment.collocationApiBaseUrl}`;
  private readonly userService = inject(UserService);

  constructor(private http: HttpClient) { }

  // Create a new offer
  createOffer(offre: any, files: File[], userId?: string): Observable<any> {
    const formData = new FormData();

    formData.append(
      'offre',
      new Blob([JSON.stringify(offre)], { type: 'application/json' })
    );

    // Use provided userId or fallback to current user
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');
    formData.append('userId', id.toString());

    files.forEach(file => formData.append('imagesColloc', file));

    return this.http.post(`${this.apiUrl}/offresCollocCreate`, formData, {
      responseType: 'text'
    });
  }

  // Get all collocation offers
  getAllOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/offresCollocGetAll`);
  }

  // Get a single offer by ID
  getOfferById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/offresColloc/${id}`);
  }

  // Get offers for the current user (owner)
  getMyOffers(ownerId?: number) {
    const id = ownerId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');
    return this.http.get<any[]>(`${this.apiUrl}/myOffresColloc/${id}`);
  }

  deleteOffer(id: number) {
    return this.http.delete(`${this.apiUrl}/deleteOffreColloc/${id}`, { responseType: 'text' });
  }

  updateOffer(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/updateOffreColloc/${id}`, data);
  }

  // Favorites
  getFavorites(userId?: number) {
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');
    return this.http.get<number[]>(`${this.apiUrl}/favorites/${id}`);
  }

  addFavorite(userId: number, offerId: number) {
    return this.http.post(
      `${this.apiUrl}/favorites/${userId}/${offerId}`, {}
    );
  }

  removeFavorite(offerId: number, userId?: number) {
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');
    return this.http.delete(`${this.apiUrl}/favorites/${offerId}/${id}`);
  }

  getNearbyOffers(lat: number, lng: number, radius: number) {
    return this.http.get<any[]>(`${this.apiUrl}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Requests
  getMyRequests(userId?: number) {
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');
    return this.http.get<any[]>(`${this.apiUrl}/requests/my`, {
      headers: { userId: id.toString() }
    });
  }

  updateRequestStatus(id: number, status: string, userId?: number) {
    const idUser = userId ?? this.userService.currentUser()?.id;
    if (!idUser) throw new Error('User not authenticated');

    return this.http.put(`${this.apiUrl}/requests/${id}/status`,
      { status },
      { headers: { userId: idUser.toString() } }
    );
  }

  createRequest(request: any, studentId?: number): Observable<string> {
    const id = studentId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');

    return this.http.post(`${this.apiUrl}/requests/create`, request, {
      headers: { 'X-USER-ID': id.toString() },
      responseType: 'text'
    }) as Observable<string>;
  }

  getRequestsForMyOffers(userId?: number): Observable<any[]> {
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');

    return this.http.get<any[]>(`${this.apiUrl}/requests/forOwner`, {
      headers: { userId: id.toString() }
    });
  }

  deleteRequest(id: number, userId?: number) {
    const idUser = userId ?? this.userService.currentUser()?.id;
    if (!idUser) throw new Error('User not authenticated');

    return this.http.delete(`${this.apiUrl}/requests/${id}`, {
      headers: { userId: idUser.toString() }
    });
  }

  getRequestsByOfferIds(offerIds: number[], userId?: number): Observable<any[]> {
    const id = userId ?? this.userService.currentUser()?.id;
    if (!id) throw new Error('User not authenticated');

    return this.http.post<any[]>(`${this.apiUrl}/requests/byOfferIds`, offerIds, {
      headers: {
        'Content-Type': 'application/json',
        userId: id.toString()
      }
    });
  }
}
