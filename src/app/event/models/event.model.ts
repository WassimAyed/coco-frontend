export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACCEPTED' | 'REFUSED' | string;
export type EventType = 'OUTDOOR' | 'INDOOR' | 'ONLINE' | string;

export interface EventDto {
	id?: number;
	name?: string;
	description?: string;
	location?: string;
	price?: number;
	latitude?: number;
	longitude?: number;
	temperature?: number;
	precipitationMm?: number;
	windSpeedKmh?: number;
	weatherCode?: number;
	weatherLabel?: string;
	predictedParticipants?: number;
	eventType?: EventType;
	startDate?: string;
	endDate?: string;
	status?: EventStatus;
	categoryId?: number;
	categoryName?: string;
	userId?: number;
	maxCapacity?: number;
	currentParticipants?: number;
	capacity?: number;
	occupiedPlaces?: number;
	availablePlaces?: number;
	imageUrl?: string;
	galleryUrls?: string[];
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateEventRequest {
	name: string;
	description?: string;
	location: string;
	latitude?: number;
	longitude?: number;
	startDate?: string;
	endDate?: string;
	status?: EventStatus;
	categoryId: number;
	eventType: EventType;
	userId?: number;
	maxCapacity: number;
	currentParticipants?: number;
	price?: number;
}

export interface UpdateEventRequest {
	name?: string;
	description?: string;
	location?: string;
	imageUrl?: string;
	latitude?: number;
	longitude?: number;
	startDate?: string;
	endDate?: string;
	status?: EventStatus;
	categoryId?: number;
	eventType?: EventType;
	userId?: number;
	maxCapacity?: number;
	currentParticipants?: number;
	price?: number;
}
