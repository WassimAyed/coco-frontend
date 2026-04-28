export interface Offer {
  id?: number;
  furnitureId: number;
  buyerId: number;
  proposedPrice: number;
  message?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt?: string;
}