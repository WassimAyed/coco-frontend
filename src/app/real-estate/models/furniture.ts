export interface Furniture {
  id?: number;
  title: string;
  description: string;
  category: string;
  condition: 'NEW' | 'GOOD' | 'USED';
  price: number;
  quantity: number;
  status: 'AVAILABLE' | 'SOLD' | 'ARCHIVED';
  sellerId: number;
  imageUrl?: string;
  imageBase64?: string;
  isFavorite?: boolean;
}