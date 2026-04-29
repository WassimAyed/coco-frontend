export interface Furniture {
  id?: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  status: string;
  sellerId: number;
  imageUrl?: string;
  imageBase64?: string;
  isFavorite?: boolean;
  isSpecial?: boolean;
  badge?: string;
  forPro?: boolean;
  minOrder?: number;
  phone?: string;
}