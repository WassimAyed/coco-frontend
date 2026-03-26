export interface Covoiturage {
  id?: number;
  pointDepart: string;
  pointArrivee: string;
  dateDepart: string;
  nombrePlaces: number;
  placesDisponibles: number;
  prixParPassager: number;
  distance: number;
  dureeEstimee: number;
  idDriver: number;
  vehicleId: number;
}

export interface Reservation {
  id?: number;
  idPassenger: number;
  dateReservation?: string;
  nbPassengers: number;
  covoiturageId: number;
  statusReservation: StatusReservation;
}

export enum StatusReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  REFUSEE = 'REFUSEE'
}

export interface Vehicule {
  id?: number;
  idUtilisateur: number;
  marque: string;
  immatriculation: string;
  couleur: string;
  capacite: number;
  image: string;
}
