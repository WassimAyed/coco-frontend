import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../../user-security/services/user.service';
import {
    ItemClaimDecisionRequest,
    ItemClaimRequest,
    ItemClaimResponse,
    ItemReportRequest,
    ItemReportResponse,
    LostItemCreateRequest,
    LostItemResponse,
    LostItemSearchParams,
    LostItemUpdateRequest,
    ReportStatus
} from '../models/lost-item.model';

@Injectable({
    providedIn: 'root'
})
export class LostAndFoundService {
    private apiUrl = 'http://localhost:9092/api/lost-found';
    private claimsUrl = 'http://localhost:9092/api/lost-found/claims';
    private reportsUrl = 'http://localhost:9092/api/lost-found/reports';

    constructor(
        private http: HttpClient,
        private userService: UserService
    ) { }

    private resolveCurrentUserId(): string | null {
        const fromSession = this.userService.currentUser()?.id;
        if (fromSession) {
            const value = String(fromSession);
            if (localStorage.getItem('userId') !== value) {
                localStorage.setItem('userId', value);
            }
            return value;
        }

        const fromStorage = localStorage.getItem('userId');
        if (fromStorage) {
            return fromStorage;
        }

        return null;
    }

    private resolveCurrentRole(): string {
        const rawRole = this.userService.currentUser()?.role;
        if (!rawRole) {
            return localStorage.getItem('role') || '';
        }

        const mappedRole = rawRole.toLowerCase() === 'admin' ? 'ADMIN' : rawRole.toUpperCase();
        if (localStorage.getItem('role') !== mappedRole) {
            localStorage.setItem('role', mappedRole);
        }
        return mappedRole;
    }

    private buildHeaders(): { headers?: HttpHeaders } {
        const userId = this.resolveCurrentUserId();

        if (!userId) {
            return {};
        }

        return {
            headers: new HttpHeaders({
                'X-User-Id': userId
            })
        };
    }

    private normalizeItem<T>(item: T): T {
        if (!item) {
            return item;
        }

        const mutable = item as any;
        if (mutable.isOwner === undefined && mutable.owner !== undefined) {
            mutable.isOwner = !!mutable.owner;
        }

        return mutable as T;
    }

    private normalizeItemsResponse(data: any): any {
        if (Array.isArray(data)) {
            return data.map((item) => this.normalizeItem(item));
        }

        if (data && Array.isArray(data.content)) {
            return {
                ...data,
                content: data.content.map((item: any) => this.normalizeItem(item))
            };
        }

        return this.normalizeItem(data);
    }

    getAllItems(): Observable<any> {
        return new Observable((subscriber) => {
            this.http.get<any>(this.apiUrl, this.buildHeaders()).subscribe({
                next: (data) => {
                    subscriber.next(this.normalizeItemsResponse(data));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }

    advancedSearch(params: LostItemSearchParams): Observable<any> {
        let httpParams = new HttpParams();

        Object.entries(params || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && `${value}`.trim() !== '') {
                httpParams = httpParams.set(key, String(value));
            }
        });

        const options = this.buildHeaders();
        return new Observable((subscriber) => {
            this.http.get<any>(`${this.apiUrl}/search/advanced`, {
            ...options,
            params: httpParams
            }).subscribe({
                next: (data) => {
                    subscriber.next(this.normalizeItemsResponse(data));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }

    getMyItems(): Observable<LostItemResponse[]> {
        return new Observable((subscriber) => {
            this.http.get<LostItemResponse[]>(`${this.apiUrl}/user/my-items`, this.buildHeaders()).subscribe({
                next: (data) => {
                    subscriber.next((data || []).map((item) => this.normalizeItem(item)));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }

    getItemById(id: number): Observable<LostItemResponse> {
        return new Observable((subscriber) => {
            this.http.get<LostItemResponse>(`${this.apiUrl}/${id}`, this.buildHeaders()).subscribe({
                next: (data) => {
                    subscriber.next(this.normalizeItem(data));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }

    createItem(item: LostItemCreateRequest): Observable<LostItemResponse> {
        return new Observable((subscriber) => {
            this.http.post<LostItemResponse>(this.apiUrl, item, this.buildHeaders()).subscribe({
                next: (data) => {
                    subscriber.next(this.normalizeItem(data));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }

    updateItem(id: number, item: LostItemUpdateRequest): Observable<LostItemResponse> {
        return new Observable((subscriber) => {
            this.http.put<LostItemResponse>(`${this.apiUrl}/${id}`, item, this.buildHeaders()).subscribe({
                next: (data) => {
                    subscriber.next(this.normalizeItem(data));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }

    deleteItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.buildHeaders());
    }

    uploadImage(file: File): Observable<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/images/upload`, formData, this.buildHeaders());
    }

    createClaim(itemId: number, payload: ItemClaimRequest): Observable<ItemClaimResponse> {
        return this.http.post<ItemClaimResponse>(`${this.claimsUrl}/items/${itemId}`, payload, this.buildHeaders());
    }

    getMyClaims(): Observable<ItemClaimResponse[]> {
        return this.http.get<ItemClaimResponse[]>(`${this.claimsUrl}/my`, this.buildHeaders());
    }

    getClaimsForMyItem(itemId: number): Observable<ItemClaimResponse[]> {
        return this.http.get<ItemClaimResponse[]>(`${this.claimsUrl}/items/${itemId}`, this.buildHeaders());
    }

    approveClaim(claimId: number, payload: ItemClaimDecisionRequest): Observable<ItemClaimResponse> {
        return this.http.patch<ItemClaimResponse>(`${this.claimsUrl}/${claimId}/approve`, payload, this.buildHeaders());
    }

    rejectClaim(claimId: number, payload: ItemClaimDecisionRequest): Observable<ItemClaimResponse> {
        return this.http.patch<ItemClaimResponse>(`${this.claimsUrl}/${claimId}/reject`, payload, this.buildHeaders());
    }

    cancelMyClaim(claimId: number): Observable<ItemClaimResponse> {
        return this.http.patch<ItemClaimResponse>(`${this.claimsUrl}/${claimId}/cancel`, {}, this.buildHeaders());
    }

    createReport(itemId: number, payload: ItemReportRequest): Observable<ItemReportResponse> {
        return this.http.post<ItemReportResponse>(`${this.reportsUrl}/items/${itemId}`, payload, this.buildHeaders());
    }

    getMyReports(): Observable<ItemReportResponse[]> {
        return this.http.get<ItemReportResponse[]>(`${this.reportsUrl}/my`, this.buildHeaders());
    }

    getReportsForModeration(status?: ReportStatus): Observable<ItemReportResponse[]> {
        const options = this.buildHeaders();
        const params = status ? new HttpParams().set('status', status) : undefined;
        return this.http.get<ItemReportResponse[]>(this.reportsUrl, {
            ...options,
            params,
            headers: (options.headers || new HttpHeaders()).set('X-User-Role', this.resolveCurrentRole())
        });
    }
}
