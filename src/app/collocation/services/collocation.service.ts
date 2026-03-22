  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';

  @Injectable({
    providedIn: 'root'
  })
  export class CollocationService {

    private apiUrl = 'http://localhost:8091/collocation';

    constructor(private http: HttpClient) { }

 createOffer(offer: any, selectedFiles: File[]): Observable<any> {
  const formData = new FormData();

  // JSON offer
  formData.append(
    'offre',
    new Blob([JSON.stringify(offer)], { type: 'application/json' })
  );

  // Images
  selectedFiles.forEach(file => {
    formData.append('imagesColloc', file);
  });

  const userId = localStorage.getItem('userId');
  if (userId) {
    formData.append('userId', userId);
  }

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

  getMyOffers(ownerId:number){
    return this.http.get<any[]>(`${this.apiUrl}/myOffresColloc/${ownerId}`);
  }

  deleteOffer(id:number){
    return this.http.delete(`${this.apiUrl}/deleteOffreColloc/${id}`,{responseType:'text'});
  }

  updateOffer(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/updateOffreColloc/${id}`, data);
  }

  // Get user's favorites
  getFavorites(userId: number) {
    return this.http.get<number[]>(`${this.apiUrl}/favorites/${userId}`);
  }

  // Add favorite
  addFavorite(userId: number, offerId: number) {
    return this.http.post(`${this.apiUrl}/favorites/${userId}/${offerId}`, {});
  }

  // Remove favorite
  removeFavorite(userId: number, offerId: number) {
    return this.http.delete(`${this.apiUrl}/favorites/${userId}/${offerId}`);
  }

  getNearbyOffers(lat: number, lng: number, radius: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
  }


  getMyRequests() {
    const userId = localStorage.getItem("ownerId");

    return this.http.get<any[]>(`${this.apiUrl}/requests/my`, {
      headers: {
        userId: userId!
      }
    });

  }

  updateRequestStatus(id: number, status: string) {
    const userId = localStorage.getItem("ownerId");

    return this.http.put(`${this.apiUrl}/requests/${id}/status`,
      { status },
      {
        headers: {
          userId: userId!
        }
      }
    );
  }

// Create a new request
createRequest(request: any, studentId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/requests/create`, request, {
        headers: { 'X-USER-ID': studentId.toString() }, // Must be string
        responseType: 'text' // <-- retourne du texte, pas du JSON
    }) as Observable<string>;
}
  // Add method to fetch requests for offers owned by current user
  getRequestsForMyOffers(): Observable<any[]> {
    const userId = localStorage.getItem("ownerId");
    return this.http.get<any[]>(`${this.apiUrl}/requests/forOwner`, {
      headers: { userId: userId! }
    });
  }

  // Add method to delete request
  deleteRequest(id: number) {
    return this.http.delete(`${this.apiUrl}/requests/${id}`, {
      headers: { userId: localStorage.getItem("ownerId")! }
    });
  }

  // Get requests by multiple offer IDs
  getRequestsByOfferIds(offerIds: number[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/requests/byOfferIds`, offerIds, {
      headers: {
        'Content-Type': 'application/json',
        'userId': localStorage.getItem('ownerId')!
      }
    });
  }





  }
