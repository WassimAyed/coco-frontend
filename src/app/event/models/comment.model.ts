export interface CommentDto {
  id?: number;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt?: string;
  updatedAt?: string;
  eventId: number;
  userId?: number;
}
