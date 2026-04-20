import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Furniture } from '../models/furniture';

@Injectable({ providedIn: 'root' })
export class FurnitureService {
  private baseUrl = 'http://localhost:8094/api/furniture';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Furniture[]> {
    return this.http.get<Furniture[]>(this.baseUrl);
  }

  getById(id: number): Observable<Furniture> {
    return this.http.get<Furniture>(`${this.baseUrl}/${id}`);
  }

  create(furniture: Furniture): Observable<Furniture> {
    return this.http.post<Furniture>(this.baseUrl, furniture);
  }

  update(id: number, furniture: Furniture): Observable<Furniture> {
    return this.http.put<Furniture>(`${this.baseUrl}/${id}`, furniture);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getSimilar(id: number): Observable<Furniture[]> {
    return this.http.get<Furniture[]>(`${this.baseUrl}/${id}/similar`);
  }
}
