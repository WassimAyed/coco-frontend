import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryDto } from '../models/category.model';
import { EventImageDto } from '../models/event-image.model';
import { DateRangeQuery, EventListQuery, NearbyQuery } from '../models/event-query.model';
import { CreateEventRequest, EventDto, EventStatus, UpdateEventRequest } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly baseUrl = environment.eventApiBaseUrl;
  private readonly categoryUrl = `${this.baseUrl.replace(/\/api\/events$/, '')}/api/categories`;

  constructor(private readonly http: HttpClient) {}

  getById(id: number): Observable<EventDto> {
    return this.http.get<EventDto>(`${this.baseUrl}/${id}`);
  }

  update(id: number, payload: UpdateEventRequest): Observable<EventDto> {
    return this.http.put<EventDto>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: number, status: EventStatus): Observable<EventDto> {
    return this.http.patch<EventDto>(
      `${this.baseUrl}/${id}/status?status=${status}`, {}
    );
  }

  getAll(query?: EventListQuery): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(this.baseUrl, { params: this.toParams(query) });
  }

  create(payload: CreateEventRequest): Observable<EventDto> {
    return this.http.post<EventDto>(this.baseUrl, payload);
  }

  getByStatus(status: EventStatus, query?: EventListQuery): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/status/${encodeURIComponent(String(status))}`, {
      params: this.toParams(query)
    });
  }

  searchByName(name: string, query?: EventListQuery): Observable<EventDto[]> {
    const params = this.toParams({ ...query, name });
    return this.http.get<EventDto[]>(`${this.baseUrl}/search`, { params });
  }

  getNearby(query: NearbyQuery): Observable<EventDto[]> {
    const params = this.toParams({
      ...query,
      lat: query.latitude,
      lng: query.longitude,
      radius: query.radiusKm
    });
    return this.http.get<EventDto[]>(`${this.baseUrl}/nearby`, { params });
  }

  getByDateRange(query: DateRangeQuery): Observable<EventDto[]> {
    const params = this.toParams({
      ...query,
      from: query.startDate,
      to: query.endDate
    });
    return this.http.get<EventDto[]>(`${this.baseUrl}/date-range`, { params });
  }

  getByCategory(categoryId: number, query?: EventListQuery): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/category/${categoryId}`, { params: this.toParams(query) });
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.categoryUrl);
  }

  getCategoryById(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.categoryUrl}/${id}`);
  }

  createCategory(payload: Partial<CategoryDto>): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.categoryUrl, payload);
  }

  updateCategory(id: number, payload: Partial<CategoryDto>): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.categoryUrl}/${id}`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoryUrl}/${id}`);
  }

  getAvailable(query?: EventListQuery): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/available`, { params: this.toParams(query) });
  }

  uploadMainImage(eventId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/${eventId}/image`, formData, { responseType: 'text' });
  }

  getGallery(eventId: number): Observable<EventImageDto[]> {
    return this.http.get<EventImageDto[]>(`${this.baseUrl}/${eventId}/gallery`);
  }

  addGalleryImage(eventId: number, file: File): Observable<EventImageDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EventImageDto>(`${this.baseUrl}/${eventId}/gallery`, formData);
  }

  deleteGalleryImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/gallery/${imageId}`);
  }

  getSimilarEvents(eventId: number, limit: number = 3): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/${eventId}/similar?limit=${limit}`
    );
  }

  private toParams(query?: object): HttpParams {
    let params = new HttpParams();

    if (!query) {
      return params;
    }

    Object.entries(query as { [key: string]: unknown }).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      params = params.set(key, String(value));
    });

    return params;
  }
}
