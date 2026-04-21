import { EventDto } from './event.model';

describe('EventDto', () => {
  it('should be able to create an object that satisfies the interface', () => {
    const event: EventDto = {
      id: 1,
      name: 'Test Event',
      location: 'Test Location'
    };
    expect(event).toBeTruthy();
  });
});
