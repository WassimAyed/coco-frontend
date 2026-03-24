import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventOwnershipService {
  private readonly key = 'eventOwnershipMap';

  getCurrentUserId(): number | null {
    const value = Number(localStorage.getItem('userId'));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  addOwnedEvent(eventId: number, userId: number): void {
    const map = this.readMap();
    const current = new Set(map[userId] || []);
    current.add(eventId);
    map[userId] = Array.from(current);
    this.writeMap(map);
  }

  removeOwnedEvent(eventId: number, userId: number): void {
    const map = this.readMap();
    map[userId] = (map[userId] || []).filter(id => id !== eventId);
    this.writeMap(map);
  }

  getOwnedEventIds(userId: number): number[] {
    const map = this.readMap();
    return map[userId] || [];
  }

  isOwned(eventId: number, userId: number): boolean {
    return this.getOwnedEventIds(userId).includes(eventId);
  }

  private readMap(): Record<number, number[]> {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as Record<number, number[]>) : {};
    } catch {
      return {};
    }
  }

  private writeMap(map: Record<number, number[]>): void {
    localStorage.setItem(this.key, JSON.stringify(map));
  }
}
