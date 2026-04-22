export interface Boost {
  id?: number;
  furnitureId: number;
  sellerId: number;
  durationDays: number;
  amount?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
}

export interface BoostAnalysis {
  suggestedPrice: number;
  currentPriceScore: number;
  visibilityScore: number;
  suggestedCategory: string;
  improvedTitle: string;
  improvedDescription: string;
  recommendedDuration: number;
  reasoning: string;
}
