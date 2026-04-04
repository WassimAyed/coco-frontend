export interface CollocationOffer {
  id: number;
  ownerId: number;
  titre: string;
  description: string;
  prixLoc: number;
  ville: string;
  chambres: number;
  meublee: boolean;
  latitude: number;
  longitude: number;
  imagesColoc: { url: string }[];

  // Add this property
  matchScore?: number;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
  };
}
