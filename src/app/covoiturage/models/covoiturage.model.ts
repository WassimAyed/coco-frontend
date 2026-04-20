export interface Covoiturage {
  id?: number;
  pointDepart: string;
  pointArrivee: string;
  dateDepart: string;
  nombrePlaces: number;
  placesDisponibles: number;
  prixParPassager: number;
  prixSuggereParAI?: number;
  distance: number;
  dureeEstimee: number;
  idDriver: number;
  vehicleId: number;
  lattitudeDepart: number;
  longitudeDepart: number;
  latitudeArrivee: number;
  longitudeArrivee: number;
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

export interface Notation {
  id?: number;
  notation: number;
  comment: string;
  idDonneur: number;
  idRecepteur: number;
}

export interface CO2Impact {
  covoiturageId: number;
  distanceKm: number;
  nombreOccupants: number;
  consommationLitres100km: number;
  facteurCo2KgParLitre: number;
  co2SoloKg: number;
  co2ParPassagerKg: number;
  co2EconomiseParPassagerKg: number;
  co2EconomiseTotalKg: number;
  equivalentArbresAn: number;
  equivalentKmVoitureSolo: number;
}
