import { SubscriptionPlan } from './subscription.model';

describe('SubscriptionPlan', () => {
  it('should be able to create an object that satisfies the interface', () => {
    const plan: SubscriptionPlan = {
      name: 'Test Plan',
      price: 10,
      type: 'monthly'
    };
    expect(plan).toBeTruthy();
  });
});
