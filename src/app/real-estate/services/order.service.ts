import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private baseUrl = 'http://localhost:8099/api/orders';
  constructor(private http: HttpClient) {}

  create(order: Order): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  getByBuyer(buyerId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/buyer/${buyerId}`);
  }

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }
}
