import { EventStatus } from './event.model';

export interface EventListQuery {
  page?: number;
  size?: number;
  sort?: string;
}

export interface EventSearchQuery extends EventListQuery {
  name: string;
}

export interface NearbyQuery extends EventListQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface DateRangeQuery extends EventListQuery {
  startDate: string;
  endDate: string;
}

export interface EventStatusQuery extends EventListQuery {
  status: EventStatus;
}
