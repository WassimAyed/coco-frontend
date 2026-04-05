import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LostItem } from '../models/lost-item.model';

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
        return this.http.get<LostItem[]>(this.apiUrl, this.buildHeaders());
    }

    getItemById(id: number): Observable<LostItem> {
        return this.http.get<LostItem>(`${this.apiUrl}/${id}`, this.buildHeaders());
    }

    createItem(item: LostItem): Observable<LostItem> {
        return this.http.post<LostItem>(this.apiUrl, item, this.buildHeaders());
    }

    updateItem(id: number, item: LostItem): Observable<LostItem> {
        return this.http.put<LostItem>(`${this.apiUrl}/${id}`, item, this.buildHeaders());
    }

    deleteItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.buildHeaders());
    }
}
