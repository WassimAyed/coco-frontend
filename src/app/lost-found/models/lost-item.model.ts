export interface LostItem {
    id?: number;
    title: string;
    description: string;
    type: 'LOST' | 'FOUND';
    category: string;
    location: string;
    dateTime: string;
    contactInfo: string;
    status: 'ACTIVE' | 'RESOLVED';
    userId: number;
    imageUrl?: string;
}
