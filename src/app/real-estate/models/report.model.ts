export interface Report {
  id?: number;
  furnitureId: number;
  reporterId: number;
  reason: string;
  description?: string;
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt?: string;
}