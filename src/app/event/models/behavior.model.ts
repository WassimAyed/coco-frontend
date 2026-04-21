export interface BehaviorDto {
  userId: number;
  eventId: number;
  categoryId?: number;
  actionType:
    | 'VIEW'
    | 'PARTICIPATE'
    | 'BOOKMARK'
    | 'COMMENT'
    | 'LIKE'
    | 'LOVE'
    | 'HAHA'
    | 'WOW'
    | 'SAD'
    | 'ANGRY'
    | 'RATE_1'
    | 'RATE_2'
    | 'RATE_3'
    | 'RATE_4'
    | 'RATE_5';
  lat?: number;
  lng?: number;
}
