export interface Notification {
  id?: number;
  userId: number;
  furnitureId?: number;
  offerId?: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
}
