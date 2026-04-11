import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../../user-security/services/user.service';
import { environment } from '../../../environments/environment';
import {
    ItemClaimDecisionRequest,
    ItemClaimRequest,
    ItemClaimResponse,
    ItemReportRequest,
    ItemReportReviewRequest,
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
    private apiUrl = environment.lostFoundApiBaseUrl;
    private claimsUrl = `${environment.lostFoundApiBaseUrl}/claims`;
    private reportsUrl = `${environment.lostFoundApiBaseUrl}/reports`;

    constructor(
        private http: HttpClient,
        private userService: UserService
    ) { }

    private resolveCurrentUserId(): string | null {
        const fromSession = this.userService.currentUser()?.id;
        if (fromSession) {
            return String(fromSession);
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

        return rawRole.toLowerCase() === 'admin' ? 'ADMIN' : rawRole.toUpperCase();
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

    private normalizeItem<T extends { isOwner?: boolean; owner?: unknown }>(item: T): T {
        if (!item) {
            return item;
        }

        if (item.isOwner === undefined && item.owner !== undefined) {
            return {
                ...item,
                isOwner: !!item.owner
            };
        }

        return item;
    }

    private normalizeItemsResponse(data: unknown): unknown {
        if (Array.isArray(data)) {
            return data.map((item) => this.normalizeItem(item as { isOwner?: boolean; owner?: unknown }));
        }

        if (this.isPagedResponse(data)) {
            return {
                ...data,
                content: data.content.map((item) => this.normalizeItem(item as { isOwner?: boolean; owner?: unknown }))
            };
        }

        if (data && typeof data === 'object') {
            return this.normalizeItem(data as { isOwner?: boolean; owner?: unknown });
        }

        return data;
    }

    private isPagedResponse(data: unknown): data is { content: unknown[] } {
        return typeof data === 'object'
            && data !== null
            && Array.isArray((data as { content?: unknown[] }).content);
    }

    getAllItems(page: number = 0, size: number = 12): Observable<any> {
        const params = new HttpParams()
            .set('page', String(page))
            .set('size', String(size));

        return new Observable((subscriber) => {
            this.http.get<any>(this.apiUrl, {
                ...this.buildHeaders(),
                params
            }).subscribe({
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

    getReportsForMyItems(): Observable<ItemReportResponse[]> {
        return this.http.get<ItemReportResponse[]>(`${this.reportsUrl}/owner/my-items`, this.buildHeaders());
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

    reviewReport(reportId: number, payload: ItemReportReviewRequest): Observable<ItemReportResponse> {
        const options = this.buildHeaders();
        return this.http.patch<ItemReportResponse>(`${this.reportsUrl}/${reportId}/review`, payload, {
            ...options,
            headers: (options.headers || new HttpHeaders()).set('X-User-Role', this.resolveCurrentRole())
        });
    }

    getAiProposals(itemId: number, topK: number = 5): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${itemId}/ai/propose?topK=${topK}`, this.buildHeaders());
    }
}
