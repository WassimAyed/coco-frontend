import { EventDto } from './event.model';

export interface ScoredEvent {
  event: EventDto;
  score: number;
  scoreLabel: string;
}
