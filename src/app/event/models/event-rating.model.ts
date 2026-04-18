export interface EventRatingDto {
  id?: number;
  eventId: number;
  userId: number;
  rating: number;
  createdAt?: string;
  averageRating?: number;
  totalRatings?: number;
}