export type LostItemType = 'LOST' | 'FOUND';
export type LostItemStatus = 'ACTIVE' | 'RESOLVED';

export interface LostItemCreateRequest {
    title: string;
    description: string;
    type: LostItemType;
    category: string;
    location: string;
    contactInfo: string;
    imageUrl?: string;
}

export interface LostItemUpdateRequest extends LostItemCreateRequest {}

export interface LostItemResponse {
    id: number;
    title: string;
    description: string;
    type: LostItemType;
    category: string;
    location: string;
    dateTime: string;
    contactInfo: string;
    status: LostItemStatus;
    userId: number;
    imageUrl?: string;
    isOwner?: boolean;
    createdAt?: string;
    updatedAt?: string;
    version?: number;
}

// Backward compatibility for existing components
export type LostItem = LostItemResponse;
