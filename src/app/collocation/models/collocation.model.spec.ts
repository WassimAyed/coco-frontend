import { CollocationOffer } from './collocation.model';

describe('CollocationOffer', () => {
  it('should be able to create an object that satisfies the interface', () => {
    const offer: CollocationOffer = {
      id: 1,
      titre: 'Test',
      description: 'Desc',
      prixLoc: 100,
      ville: 'Tunis',
      chambres: 2,
      meublee: true,
      latitude: 0,
      longitude: 0,
      imagesColoc: []
    };
    expect(offer).toBeTruthy();
  });
});
