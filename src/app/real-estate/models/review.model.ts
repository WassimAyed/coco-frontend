export interface Review {
  id?: number;
  furnitureId: number;
  reviewerId: number;
  rating: number;
  comment?: string;
  createdAt?: string;
}
