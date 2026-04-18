export interface ProfileRequestDTO {
  userId: string;
  age: number;
  gender: string;
  budget: number;
  city: string;
  smoker: boolean;
  pets: boolean;
  cleanliness: number;
  sleepSchedule: string;
  studyLevel: string;
  socialLevel: number;
  acceptsGuests: boolean;
  noiseTolerance: number;
  latitude?: number;
  longitude?: number;
}
