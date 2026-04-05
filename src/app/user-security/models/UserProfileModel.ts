export interface UserProfileModel {
  id: number;
  user: any; // Ideally replace 'any' with your User interface
  age: number;
  gender: string;
  budget: number;
  city: string;
  smoker: boolean;
  pets: boolean;
  cleanliness: number; // 1-5 or 1-10 scale
  sleepSchedule: string;
  studyLevel: string;
  socialLevel: number;
  acceptsGuests: boolean;
  noiseTolerance: number;
  interests: string[];
  latitude: number;
  longitude: number;
}