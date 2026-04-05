export type ServiceCategoryId =
  | 'academic'
  | 'mobility'
  | 'errands'
  | 'creative'
  | 'tech'
  | 'wellbeing';

export type ServiceRequestStatus =
  | 'pending'
  | 'accepted'
  | 'completed'
  | 'declined';

export type ServiceModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export type ServiceDeliveryMode = 'online' | 'on-site' | 'hybrid';

export interface ServiceCategory {
  id: ServiceCategoryId;
  label: string;
  description: string;
  accentClass: string;
}

export interface ServiceReview {
  id: string;
  serviceId: string;
  reviewerName: string;
  reviewerDepartment: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StudentService {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: ServiceCategoryId;
  priceLabel: string;
  deliveryMode: ServiceDeliveryMode;
  tags: string[];
  location: string;
  providerId: string;
  providerName: string;
  providerHeadline: string;
  providerAvatar: string;
  providerDepartment: string;
  coverImage: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
  requestCount: number;
  moderationStatus: ServiceModerationStatus;
  moderatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentServiceRequest {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceCategoryId: ServiceCategoryId;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  requesterAvatar: string;
  providerId: string;
  providerName: string;
  message: string;
  preferredDate: string;
  status: ServiceRequestStatus;
  budgetLabel: string;
  createdAt: string;
}

export interface StudentServiceRequestFormValue {
  message: string;
  preferredDate: string;
  budgetLabel: string;
}

export interface ServiceRecommendation {
  id: string;
  serviceId: string;
  title: string;
  reason: string;
  score: number;
  matchingTags: string[];
}

export interface StudentServiceCoverUploadResult {
  objectKey: string;
  imageUrl: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface StudentServiceConversation {
  id: string;
  requestId: string;
  serviceId: string;
  serviceTitle: string;
  otherParticipantId: string;
  otherParticipantName: string;
  active: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
}

export interface StudentServiceChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  sentAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export interface StudentServiceChatTypingIndicator {
  conversationId: string;
  senderId: string;
  senderName: string;
  typing: boolean;
  sentAt: string;
}

export interface StudentServiceFilters {
  search: string;
  categoryId: ServiceCategoryId | 'all';
  deliveryMode: ServiceDeliveryMode | 'all';
  minRating: number;
  featuredOnly: boolean;
}

export interface StudentServiceFormValue {
  title: string;
  shortDescription: string;
  description: string;
  categoryId: ServiceCategoryId;
  priceLabel: string;
  deliveryMode: ServiceDeliveryMode;
  location: string;
  tags: string;
  coverImage: string;
}
