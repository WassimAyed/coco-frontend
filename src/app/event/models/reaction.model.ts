export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface ReactionDto {
  id?: number;
  type: ReactionType;
  authorName: string;
  authorEmail: string;
  eventId: number;
}

export interface ReactionSummaryDto {
  eventId?: number;
  totalReactions?: number;
  reactionCounts?: Partial<Record<ReactionType, number>>;
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡'
};
