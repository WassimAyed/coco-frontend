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
}
