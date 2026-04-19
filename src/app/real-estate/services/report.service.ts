import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private baseUrl = 'http://localhost:8094/api/reports';

  constructor(private http: HttpClient) {}

  create(report: Report): Observable<Report> {
    return this.http.post<Report>(this.baseUrl, report);
  }

  getAll(): Observable<Report[]> {
    return this.http.get<Report[]>(this.baseUrl);
  }

  getByFurniture(furnitureId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.baseUrl}/furniture/${furnitureId}`);
  }

  updateStatus(id: number, status: string): Observable<Report> {
    return this.http.put<Report>(`${this.baseUrl}/${id}/status?status=${status}`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
