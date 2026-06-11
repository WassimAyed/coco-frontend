import { Covoiturage } from './covoiturage.model';

describe('Covoiturage', () => {
  it('should be able to create an object that satisfies the interface', () => {
    const covoiturage: Covoiturage = {
      pointDepart: 'A',
      pointArrivee: 'B',
      dateDepart: '2023-01-01',
      nombrePlaces: 4,
      placesDisponibles: 4,
      prixParPassager: 10,
      distance: 100,
      dureeEstimee: 60,
      idDriver: 1,
      vehicleId: 1,
      lattitudeDepart: 0,
      longitudeDepart: 0,
      latitudeArrivee: 0,
      longitudeArrivee: 0
    };
    expect(covoiturage).toBeTruthy();// l'interface est respectée ?
  });
});
