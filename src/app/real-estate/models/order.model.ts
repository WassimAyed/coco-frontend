export interface OrderItem {
  id?: number;
  furnitureId: number;
  furnitureTitle: string;
  price: number;
  quantity: number;
}

export interface Order {
  id?: number;
  buyerId: number;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  paymentMethod: string;
  status?: string;
  createdAt?: string;
  totalAmount: number;
  items: OrderItem[];
}
