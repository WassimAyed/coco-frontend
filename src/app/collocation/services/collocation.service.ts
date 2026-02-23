import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollocationService {

  private apiUrl = 'http://localhost:8091/collocation';

  constructor(private http: HttpClient) { }

  // Create a new collocation offer with files
 createOffer(offer: any, selectedFiles: File[]): Observable<any> {
  const formData = new FormData();
  formData.append('offre', new Blob([JSON.stringify(offer)], { type: 'application/json' }));

  selectedFiles.forEach(file => {
    formData.append('imagesColloc', file);
  });

  // Set responseType to 'text'
  return this.http.post(`${this.apiUrl}/offresCollocCreate`, formData, { responseType: 'text' });
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

}
