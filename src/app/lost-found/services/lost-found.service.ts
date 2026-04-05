import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LostItem } from '../models/lost-item.model';

@Injectable({
    providedIn: 'root'
})
export class LostAndFoundService {
    private apiUrl = 'http://localhost:9092/api/lost-found';

    constructor(private http: HttpClient) { }

    getAllItems(): Observable<any> {
        return this.http.get<LostItem[]>(this.apiUrl);
    }

    getItemById(id: number): Observable<LostItem> {
        return this.http.get<LostItem>(`${this.apiUrl}/${id}`);
    }

    createItem(item: LostItem): Observable<LostItem> {
        return this.http.post<LostItem>(this.apiUrl, item);
    }

    updateItem(id: number, item: LostItem): Observable<LostItem> {
        return this.http.put<LostItem>(`${this.apiUrl}/${id}`, item);
    }

    deleteItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
