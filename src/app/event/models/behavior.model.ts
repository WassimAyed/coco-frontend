export interface BehaviorDto {
  userId: number;
  eventId: number;
  categoryId?: number;
  actionType: 'VIEW' | 'PARTICIPATE' | 'BOOKMARK';
  lat?: number;
  lng?: number;
}
