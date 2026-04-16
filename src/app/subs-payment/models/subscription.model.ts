export interface SubscriptionPlan {
  id?: number;
  name: string;
  price: number;
  postLimit?: number;
  durationDays?: number;
  type: string;
}

export interface UserSubscription {
  id?: number;
  userId: number;
  plan: SubscriptionPlan;
  startDate: Date;
  endDate?: Date;
  status: string;
  remainingPosts?: number;
}

export interface Payment {
  id?: number;
  userId: number;
  subscription: UserSubscription;
  amount: number;
  currency: string;
  status: string;
  stripePaymentId: string;
  createdAt: Date;
}
