import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Furniture } from '../models/furniture';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FurnitureService {
  private baseUrl = 'http://localhost:8099/api/furniture';
  private readonly opts = { withCredentials: false };

  constructor(private http: HttpClient) {}

  getAll(): Observable<Furniture[]> {
    return this.http.get<Furniture[]>(this.baseUrl, this.opts);
  }

  getById(id: number): Observable<Furniture> {
    return this.http.get<Furniture>(`${this.baseUrl}/${id}`, this.opts);
  }

  create(furniture: Furniture): Observable<Furniture> {
    return this.http.post<Furniture>(this.baseUrl, furniture, this.opts);
  }

  update(id: number, furniture: Furniture): Observable<Furniture> {
    return this.http.put<Furniture>(`${this.baseUrl}/${id}`, furniture, this.opts);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.opts);
  }

  getSimilar(id: number): Observable<Furniture[]> {
    return this.http.get<Furniture[]>(`${this.baseUrl}/${id}/similar`, this.opts);
  }
}
