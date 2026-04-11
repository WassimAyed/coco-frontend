export type LostItemType = 'LOST' | 'FOUND';
export type LostItemStatus = 'ACTIVE' | 'RESOLVED' | 'BLOCKED';
export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
export type ReportStatus = 'OPEN' | 'REVIEWED' | 'ACTION_TAKEN' | 'REJECTED';

export interface LostItemCreateRequest {
    title: string;
    description: string;
    type: LostItemType;
    category: string;
    location: string;
    contactInfo: string;
    imageUrl?: string;
}

export interface LostItemUpdateRequest extends LostItemCreateRequest { }

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
    aiProposals?: any[];
}

export interface LostItemSearchParams {
    keyword?: string;
    type?: LostItemType;
    status?: LostItemStatus;
    category?: string;
    location?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export interface ItemClaimRequest {
    proofMessage: string;
}

export interface ItemClaimDecisionRequest {
    comment?: string;
}

export interface ItemClaimResponse {
    id: number;
    itemId: number;
    claimantUserId: number;
    proofMessage: string;
    status: ClaimStatus;
    ownerDecisionComment?: string;
    decidedByUserId?: number;
    decidedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ItemReportRequest {
    reason: string;
    details?: string;
}

export interface ItemReportReviewRequest {
    status: ReportStatus;
    moderatorComment?: string;
}

export interface ItemReportResponse {
    id: number;
    itemId: number;
    itemTitle?: string;
    itemStatus?: LostItemStatus;
    itemOwnerUserId?: number;
    reporterUserId: number;
    reason: string;
    details?: string;
    status: ReportStatus;
    moderatorComment?: string;
    reviewedByUserId?: number;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Backward compatibility for existing components
export type LostItem = LostItemResponse;
