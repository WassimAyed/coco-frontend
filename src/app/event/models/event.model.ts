export type EventStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | string;

export interface EventDto {
	id?: number;
	name?: string;
	description?: string;
	location?: string;
	latitude?: number;
	longitude?: number;
	fullAddress?: string;
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
	fullAddress?: string;
	startDate?: string;
	endDate?: string;
	status?: EventStatus;
	categoryId: number;
	userId?: number;
	maxCapacity: number;
	currentParticipants?: number;
}

export interface UpdateEventRequest {
	name?: string;
	description?: string;
	location?: string;
	imageUrl?: string;
	latitude?: number;
	longitude?: number;
	fullAddress?: string;
	startDate?: string;
	endDate?: string;
	status?: EventStatus;
	categoryId?: number;
	userId?: number;
	maxCapacity?: number;
	currentParticipants?: number;
}
