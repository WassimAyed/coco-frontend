import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LostItemCreateRequest, LostItemResponse, LostItemUpdateRequest } from '../models/lost-item.model';

@Injectable({
    providedIn: 'root'
})
export class LostAndFoundService {
    private apiUrl = 'http://localhost:9092/api/lost-found';

    constructor(private http: HttpClient) { }

    private buildHeaders(): { headers?: HttpHeaders } {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            return {};
        }

        return {
            headers: new HttpHeaders({
                'X-User-Id': userId
            })
        };
    }

    getAllItems(): Observable<any> {
        return this.http.get<LostItemResponse[]>(this.apiUrl, this.buildHeaders());
    }

    getItemById(id: number): Observable<LostItemResponse> {
        return this.http.get<LostItemResponse>(`${this.apiUrl}/${id}`, this.buildHeaders());
    }

    createItem(item: LostItemCreateRequest): Observable<LostItemResponse> {
        return this.http.post<LostItemResponse>(this.apiUrl, item, this.buildHeaders());
    }

    updateItem(id: number, item: LostItemUpdateRequest): Observable<LostItemResponse> {
        return this.http.put<LostItemResponse>(`${this.apiUrl}/${id}`, item, this.buildHeaders());
    }

    deleteItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.buildHeaders());
    }
}
