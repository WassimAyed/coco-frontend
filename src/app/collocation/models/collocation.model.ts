export interface CollocationOffer {
  id: number;
  titre: string;
  description: string;
  prixLoc: number;
  ville: string;
  chambres: number;
  meublee: boolean;
  latitude: number;
  longitude: number;
  imagesColoc: { url: string }[];

  // ✅ ADD THIS
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
  };
}
