import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OrderItem } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  private cartKey = 'furniture_cart';
  private cartSubject = new BehaviorSubject<OrderItem[]>(this.loadCart());

  cart$ = this.cartSubject.asObservable();

  private loadCart(): OrderItem[] {
    const data = localStorage.getItem(this.cartKey);
    return data ? JSON.parse(data) : [];
  }

  private saveCart(items: OrderItem[]): void {
    localStorage.setItem(this.cartKey, JSON.stringify(items));
    this.cartSubject.next(items);
  }

  getItems(): OrderItem[] {
    return this.cartSubject.value;
  }

  addItem(item: OrderItem): boolean {
    const items = this.getItems();
    const existing = items.find(i => i.furnitureId === item.furnitureId);
    if (existing) {
      return false; // already in cart — no duplicate
    }
    items.push(item);
    this.saveCart(items);
    return true;
  }

  removeItem(furnitureId: number): void {
    const items = this.getItems().filter(i => i.furnitureId !== furnitureId);
    this.saveCart(items);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  getTotal(): number {
    return this.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  getCount(): number {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  }
}
