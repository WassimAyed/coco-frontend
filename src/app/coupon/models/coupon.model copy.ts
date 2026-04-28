export interface Coupon {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  category: string;
  expirationDate: string;
  maxUsage: number;
  currentUsage: number;
  isActive: boolean;
  imageUrl: string;
  partnerName: string;
  createdAt: string;
  available: boolean;
}

export interface UserCoupon {
  id: number;
  userId: number;
  status: 'CLAIMED' | 'USED' | 'EXPIRED';
  claimedAt: string;
  usedAt: string;
  couponId: number;
  couponCode: string;
  couponTitle: string;
  couponDescription: string;
  couponImageUrl: string;
  couponPartnerName: string;
  couponCategory: string;
  couponDiscountType: string;
  couponDiscountValue: number;
  couponExpirationDate: string;
}