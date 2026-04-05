import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LostItem {
  id: number;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  category: string;
  location: string;
  dateTime: string;
  contactInfo: string;
  status: 'ACTIVE' | 'RESOLVED';
  userId: number;
  imageUrl: string;
  isOwner: boolean;
}

export interface LostItemRequest {
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  category: string;
  location: string;
  contactInfo: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LostFoundService {
  private apiUrl = 'http://localhost:8086/api/v1/items';
  private userId = 1; // À remplacer par l'ID utilisateur de l'auth

  constructor(private http: HttpClient) {}

  /**
   * Create a new lost/found item
   */
  createItem(item: LostItemRequest): Observable<LostItem> {
    return this.http.post<LostItem>(this.apiUrl, item, {
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Get all items with pagination
   */
  getAllItems(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.apiUrl, {
      params,
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Get item by ID
   */
  getItemById(id: number): Observable<LostItem> {
    return this.http.get<LostItem>(`${this.apiUrl}/${id}`, {
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Get user's own items
   */
  getUserItems(): Observable<LostItem[]> {
    return this.http.get<LostItem[]>(`${this.apiUrl}/user/my-items`, {
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Update item
   */
  updateItem(id: number, item: LostItemRequest): Observable<LostItem> {
    return this.http.put<LostItem>(`${this.apiUrl}/${id}`, item, {
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Mark item as resolved
   */
  markAsResolved(id: number): Observable<LostItem> {
    return this.http.patch<LostItem>(`${this.apiUrl}/${id}/resolve`, {}, {
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Delete item
   */
  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Search by type (LOST or FOUND)
   */
  searchByType(type: 'LOST' | 'FOUND'): Observable<LostItem[]> {
    const params = new HttpParams().set('type', type);
    return this.http.get<LostItem[]>(`${this.apiUrl}/search/type`, {
      params,
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Filter by category
   */
  filterByCategory(category: string): Observable<LostItem[]> {
    const params = new HttpParams().set('category', category);
    return this.http.get<LostItem[]>(`${this.apiUrl}/filter/category`, {
      params,
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  /**
   * Filter by location
   */
  filterByLocation(location: string): Observable<LostItem[]> {
    const params = new HttpParams().set('location', location);
    return this.http.get<LostItem[]>(`${this.apiUrl}/filter/location`, {
      params,
      headers: { 'X-User-Id': this.userId.toString() }
    });
  }

  setUserId(userId: number): void {
    this.userId = userId;
  }
}
