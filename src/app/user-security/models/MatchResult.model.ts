export interface MatchResultDTO {
  userId: number;
  age: number;
  gender: string;
  city: string;
  budget: number;
  score: number; // match score from ML
  latitude?: number;
  longitude?: number;
}
