import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private readonly openMeteoUrl = 'https://api.open-meteo.com/v1/forecast';

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

  getWeatherPreview(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate?: string
  ): Observable<Pick<EventDto, 'temperature' | 'precipitationMm' | 'windSpeedKmh' | 'weatherCode' | 'weatherLabel'> | null> {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    let effectiveEnd = endDate ? new Date(endDate) : new Date(start);
    if (Number.isNaN(effectiveEnd.getTime()) || effectiveEnd < start) {
      effectiveEnd = new Date(start);
    }

    const maxEnd = new Date(start);
    maxEnd.setDate(maxEnd.getDate() + 6);
    if (effectiveEnd > maxEnd) {
      effectiveEnd = maxEnd;
    }

    const formatDate = (value: Date): string => {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const params = new HttpParams()
      .set('latitude', String(latitude))
      .set('longitude', String(longitude))
      .set('daily', 'weather_code,temperature_2m_mean,precipitation_sum,wind_speed_10m_max')
      .set('timezone', 'auto')
      .set('start_date', formatDate(start))
      .set('end_date', formatDate(effectiveEnd));

    return this.http.get<any>(this.openMeteoUrl, { params }).pipe(
      map(response => {
        const daily = response?.daily;
        const weatherCodes: unknown[] = Array.isArray(daily?.weather_code) ? daily.weather_code : [];
        const temperatures: unknown[] = Array.isArray(daily?.temperature_2m_mean) ? daily.temperature_2m_mean : [];
        const precipitation: unknown[] = Array.isArray(daily?.precipitation_sum) ? daily.precipitation_sum : [];
        const windSpeed: unknown[] = Array.isArray(daily?.wind_speed_10m_max) ? daily.wind_speed_10m_max : [];

        if (!weatherCodes.length || !temperatures.length || !precipitation.length || !windSpeed.length) {
          return null;
        }

        const count = Math.min(temperatures.length, precipitation.length, windSpeed.length);
        if (!count) {
          return null;
        }

        let tempSum = 0;
        let precipSum = 0;
        let windSum = 0;

        for (let i = 0; i < count; i++) {
          tempSum += Number(temperatures[i]) || 0;
          precipSum += Number(precipitation[i]) || 0;
          windSum += Number(windSpeed[i]) || 0;
        }

        const weatherCode = Number(weatherCodes[0]);
        return {
          temperature: Math.round((tempSum / count) * 10) / 10,
          precipitationMm: Math.round((precipSum / count) * 100) / 100,
          windSpeedKmh: Math.round((windSum / count) * 10) / 10,
          weatherCode,
          weatherLabel: this.mapWeatherCode(weatherCode)
        };
      })
    );
  }

  private mapWeatherCode(weatherCode: number): string {
    if (weatherCode === 0) {
      return 'Clear';
    }
    if (weatherCode >= 1 && weatherCode <= 3) {
      return 'Clouds';
    }
    if (weatherCode === 45 || weatherCode === 48) {
      return 'Fog';
    }
    if ((weatherCode >= 51 && weatherCode <= 57)
      || (weatherCode >= 61 && weatherCode <= 67)
      || (weatherCode >= 80 && weatherCode <= 82)) {
      return 'Rain';
    }
    if ((weatherCode >= 71 && weatherCode <= 77)
      || (weatherCode >= 85 && weatherCode <= 86)) {
      return 'Snow';
    }
    if (weatherCode >= 95 && weatherCode <= 99) {
      return 'Thunderstorm';
    }
    return 'Unknown';
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
