export interface CollocationImage {
  id?: number;
  filename?: string;   // from backend
  url?: string;        // from backend
}

export interface CollocationOffer {
  id: number;
  titre: string;
  description: string;
  prixLoc: number;
  ville: string;
  chambres: number;
  meublee: boolean;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  expiryDate?: Date;
  ownerId?: number;
  imagesColoc?: CollocationImage[];  // now uses proper fields
}
