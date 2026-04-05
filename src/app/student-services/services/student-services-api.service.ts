import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { createAvatarDataUrl } from '../../shared/utils/avatar.util';
import { STUDENT_SERVICE_CATEGORIES } from '../data/student-services.seed';
import {
  ServiceCategory,
  ServiceModerationStatus,
  ServiceRecommendation,
  StudentService,
  StudentServiceChatMessage,
  StudentServiceConversation,
  StudentServiceCoverUploadResult,
  StudentServiceFilters,
  StudentServiceFormValue,
  StudentServiceRequest,
  StudentServiceRequestFormValue,
} from '../models/student-service.model';
import { UserService } from '../../user-security/services/user.service';
import { loadAuthSession } from '../../user-security/utils/auth-session.util';

type ApiServiceCategory =
  | 'ACADEMIC'
  | 'MOBILITY'
  | 'ERRANDS'
  | 'CREATIVE'
  | 'TECH'
  | 'WELLBEING';

type ApiDeliveryMode = 'ONLINE' | 'ON_SITE' | 'HYBRID';
type ApiRequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';
type ApiModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface StudentServiceApiDto {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: ApiServiceCategory;
  priceLabel: string;
  deliveryMode: ApiDeliveryMode;
  tags: string[];
  location: string;
  providerId: number;
  providerName: string;
  providerHeadline: string;
  providerAvatar: string;
  providerDepartment: string;
  coverImageUrl: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
  requestCount: number;
  moderationStatus: ApiModerationStatus;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentServiceRequestApiDto {
  id: number;
  serviceId: number;
  serviceTitle: string;
  serviceCategory: ApiServiceCategory;
  requesterId: number;
  requesterName: string;
  requesterDepartment: string;
  requesterAvatar: string;
  providerId: number;
  providerName: string;
  message: string;
  preferredDate: string;
  status: ApiRequestStatus;
  budgetLabel: string;
  createdAt: string;
}

interface StudentServiceReviewApiDto {
  id: number;
  serviceId: number;
  reviewerId?: number;
  reviewerName: string;
  reviewerDepartment: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface StudentServiceRecommendationApiDto {
  serviceId: number;
  title: string;
  reason: string;
  score: number;
  matchingTags: string[];
}

interface StudentServiceConversationApiDto {
  id: number;
  requestId: number;
  serviceId: number;
  serviceTitle: string;
  requesterId: number;
  requesterName: string;
  providerId: number;
  providerName: string;
  otherParticipantId: number;
  otherParticipantName: string;
  active: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentServiceChatMessageApiDto {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  sentAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}

interface StudentServiceCoverUploadApiDto {
  objectKey: string;
  imageUrl: string;
  fileName: string;
  size: number;
  mimeType: string;
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

@Injectable({
  providedIn: 'root',
})
export class StudentServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  getCategories(): Observable<ServiceCategory[]> {
    return of(structuredClone(STUDENT_SERVICE_CATEGORIES));
  }

  getServices(filters?: Partial<StudentServiceFilters>): Observable<StudentService[]> {
    let params = new HttpParams();

    if (filters?.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters?.categoryId && filters.categoryId !== 'all') {
      params = params.set('category', filters.categoryId);
    }
    if (filters?.deliveryMode && filters.deliveryMode !== 'all') {
      params = params.set('deliveryMode', filters.deliveryMode);
    }
    if (filters?.minRating && filters.minRating > 0) {
      params = params.set('minRating', String(filters.minRating));
    }
    if (filters?.featuredOnly) {
      params = params.set('featuredOnly', 'true');
    }

    return this.http
      .get<StudentServiceApiDto[]>(this.buildStudentServicesUrl(''), {
        ...this.getAuthorizedOptions(),
        params,
      })
      .pipe(map((services) => services.map((service) => this.mapService(service))));
  }

  getServiceById(serviceId: string): Observable<StudentService | undefined> {
    return this.http
      .get<StudentServiceApiDto>(this.buildStudentServicesUrl(`/${serviceId}`), {
        ...this.getAuthorizedOptions(),
      })
      .pipe(
        map((service) => this.mapService(service)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  getMyServices(): Observable<StudentService[]> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of([]);
    }

    return this.http
      .get<StudentServiceApiDto[]>(
        this.buildStudentServicesUrl(`/provider/${currentUserId}`),
        this.getAuthorizedOptions(),
      )
      .pipe(map((services) => services.map((service) => this.mapService(service))));
  }

  getAdminServices(
    moderationStatus: ServiceModerationStatus | 'all' = 'all',
  ): Observable<StudentService[]> {
    let params = new HttpParams();
    if (moderationStatus !== 'all') {
      params = params.set('moderationStatus', moderationStatus);
    }

    return this.http
      .get<StudentServiceApiDto[]>(
        this.buildStudentServicesUrl('/admin/all'),
        {
          ...this.getAuthorizedOptions(),
          params,
        },
      )
      .pipe(map((services) => services.map((service) => this.mapService(service))));
  }

  createService(payload: StudentServiceFormValue): Observable<StudentService> {
    return this.http
      .post<StudentServiceApiDto>(
        this.buildStudentServicesUrl(''),
        this.buildServicePayload(payload),
        this.getAuthorizedOptions(),
      )
      .pipe(map((service) => this.mapService(service)));
  }

  updateService(
    serviceId: string,
    payload: StudentServiceFormValue,
  ): Observable<StudentService | undefined> {
    return this.http
      .put<StudentServiceApiDto>(
        this.buildStudentServicesUrl(`/${serviceId}`),
        this.buildServicePayload(payload),
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((service) => this.mapService(service)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  deleteService(serviceId: string): Observable<boolean> {
    return this.http
      .delete<void>(this.buildStudentServicesUrl(`/${serviceId}`), this.getAuthorizedOptions())
      .pipe(
        map(() => true),
        catchError((error) =>
          error?.status === 404 ? of(false) : throwError(() => error),
        ),
      );
  }

  updateServiceModerationStatus(
    serviceId: string,
    moderationStatus: ServiceModerationStatus,
  ): Observable<StudentService | undefined> {
    return this.http
      .put<StudentServiceApiDto>(
        this.buildStudentServicesUrl(`/admin/${serviceId}/moderation`),
        { status: this.toApiModerationStatus(moderationStatus) },
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((service) => this.mapService(service)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  updateServiceTags(
    serviceId: string,
    tags: string[],
  ): Observable<StudentService | undefined> {
    return this.http
      .put<StudentServiceApiDto>(
        this.buildStudentServicesUrl(`/admin/${serviceId}/tags`),
        { tags },
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((service) => this.mapService(service)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  uploadCoverImage(file: File): Observable<StudentServiceCoverUploadResult> {
    const formData = new FormData();
    const currentUserId = this.getRequiredCurrentUserId(false);
    formData.append('file', file);
    let params = new HttpParams();
    if (currentUserId) {
      params = params.set('ownerId', currentUserId);
    }

    const authorizedOptions = this.getAuthorizedOptions();

    return this.http
      .post<StudentServiceCoverUploadApiDto>(
        this.buildStudentServicesUrl('/upload-cover'),
        formData,
        {
          ...authorizedOptions,
          headers: authorizedOptions.headers.delete('Content-Type'),
          params,
        },
      )
      .pipe(
        map((response) => ({
          fileName: response.fileName,
          imageUrl: response.imageUrl,
          mimeType: response.mimeType,
          objectKey: response.objectKey,
          size: response.size,
        })),
      );
  }

  getMyRequests(): Observable<StudentServiceRequest[]> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of([]);
    }

    return this.http
      .get<StudentServiceRequestApiDto[]>(
        this.buildStudentServicesUrl(`/requests/requester/${currentUserId}`),
        this.getAuthorizedOptions(),
      )
      .pipe(map((requests) => requests.map((request) => this.mapRequest(request))));
  }

  getProviderRequests(): Observable<StudentServiceRequest[]> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of([]);
    }

    return this.http
      .get<StudentServiceRequestApiDto[]>(
        this.buildStudentServicesUrl(`/requests/provider/${currentUserId}`),
        this.getAuthorizedOptions(),
      )
      .pipe(map((requests) => requests.map((request) => this.mapRequest(request))));
  }

  getMyRequestForService(
    serviceId: string,
  ): Observable<StudentServiceRequest | undefined> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of(undefined);
    }

    return this.http
      .get<StudentServiceRequestApiDto>(
        this.buildStudentServicesUrl(
          `/${serviceId}/requests/requester/${currentUserId}`,
        ),
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((request) => this.mapRequest(request)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  createRequestForService(
    service: StudentService,
    payload: StudentServiceRequestFormValue,
  ): Observable<StudentServiceRequest> {
    const currentUser = this.getRequiredCurrentUser();

    return this.http
      .post<StudentServiceRequestApiDto>(
        this.buildStudentServicesUrl(`/${service.id}/requests`),
        {
          budgetLabel: payload.budgetLabel.trim(),
          message: payload.message.trim(),
          preferredDate: payload.preferredDate.trim(),
          requesterAvatar: this.resolveUserAvatar(currentUser),
          requesterDepartment: this.resolveUserDepartment(currentUser),
          requesterId: Number(currentUser.id),
          requesterName: this.resolveUserDisplayName(currentUser),
        },
        this.getAuthorizedOptions(),
      )
      .pipe(map((request) => this.mapRequest(request)));
  }

  updateRequestStatus(
    requestId: string,
    status: 'accepted' | 'declined' | 'completed',
  ): Observable<StudentServiceRequest | undefined> {
    return this.http
      .put<StudentServiceRequestApiDto>(
        this.buildStudentServicesUrl(`/requests/${requestId}/status`),
        { status: this.toApiRequestStatus(status) },
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((request) => this.mapRequest(request)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  getReviewsForService(serviceId: string) {
    return this.http
      .get<StudentServiceReviewApiDto[]>(
        this.buildStudentServicesUrl(`/${serviceId}/reviews`),
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((reviews) =>
          reviews.map((review) => ({
            comment: review.comment,
            createdAt: review.createdAt,
            id: String(review.id),
            rating: review.rating,
            reviewerDepartment: review.reviewerDepartment,
            reviewerName: review.reviewerName,
            serviceId: String(review.serviceId),
          })),
        ),
      );
  }

  getRecommendations(): Observable<ServiceRecommendation[]> {
    let params = new HttpParams();
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (currentUserId) {
      params = params.set('userId', currentUserId);
    }

    return this.http
      .get<StudentServiceRecommendationApiDto[]>(
        this.buildStudentServicesUrl('/recommendations'),
        {
          ...this.getAuthorizedOptions(),
          params,
        },
      )
      .pipe(
        map((recommendations) =>
          recommendations.map((item) => ({
            id: `rec-${item.serviceId}`,
            matchingTags: item.matchingTags,
            reason: item.reason,
            score: item.score,
            serviceId: String(item.serviceId),
            title: item.title,
          })),
        ),
      );
  }

  getConversations(): Observable<StudentServiceConversation[]> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of([]);
    }

    return this.http
      .get<StudentServiceConversationApiDto[]>(
        this.buildStudentServicesUrl(`/chat/conversations`),
        {
          ...this.getAuthorizedOptions(),
          params: new HttpParams().set('participantId', currentUserId),
        },
      )
      .pipe(
        map((conversations) =>
          conversations.map((conversation) => this.mapConversation(conversation)),
        ),
      );
  }

  getConversationForRequest(
    requestId: string,
  ): Observable<StudentServiceConversation | undefined> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of(undefined);
    }

    return this.http
      .get<StudentServiceConversationApiDto>(
        this.buildStudentServicesUrl(`/chat/conversations/request/${requestId}`),
        {
          ...this.getAuthorizedOptions(),
          params: new HttpParams().set('participantId', currentUserId),
        },
      )
      .pipe(
        map((conversation) => this.mapConversation(conversation)),
        catchError((error) =>
          error?.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  getConversationMessages(
    conversationId: string,
  ): Observable<StudentServiceChatMessage[]> {
    const currentUserId = this.getRequiredCurrentUserId(false);
    if (!currentUserId) {
      return of([]);
    }

    return this.http
      .get<StudentServiceChatMessageApiDto[]>(
        this.buildStudentServicesUrl(`/chat/conversations/${conversationId}/messages`),
        {
          ...this.getAuthorizedOptions(),
          params: new HttpParams().set('participantId', currentUserId),
        },
      )
      .pipe(
        map((messages) =>
          messages.map((message) => ({
            content: message.content,
            conversationId: String(message.conversationId),
            deletedAt: message.deletedAt ?? null,
            editedAt: message.editedAt ?? null,
            id: String(message.id),
            imageUrl: message.imageUrl ?? null,
            senderId: String(message.senderId),
            senderName: message.senderName,
            sentAt: message.sentAt,
          })),
        ),
      );
  }

  sendConversationMessage(
    conversationId: string,
    content: string,
  ): Observable<StudentServiceChatMessage> {
    const currentUser = this.getRequiredCurrentUser();

    return this.http
      .post<StudentServiceChatMessageApiDto>(
        this.buildStudentServicesUrl('/chat/messages'),
        {
          content: content.trim(),
          conversationId: Number(conversationId),
          senderId: Number(currentUser.id),
          senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        },
        this.getAuthorizedOptions(),
      )
      .pipe(
        map((message) => ({
          content: message.content,
          conversationId: String(message.conversationId),
          deletedAt: message.deletedAt ?? null,
          editedAt: message.editedAt ?? null,
          id: String(message.id),
          imageUrl: message.imageUrl ?? null,
          senderId: String(message.senderId),
          senderName: message.senderName,
          sentAt: message.sentAt,
        })),
      );
  }

  updateConversationMessage(
    messageId: string,
    content: string,
  ): Observable<StudentServiceChatMessage> {
    const currentUser = this.getRequiredCurrentUser();

    return this.http
      .put<StudentServiceChatMessageApiDto>(
        this.buildStudentServicesUrl(`/chat/messages/${messageId}`),
        {
          content: content.trim(),
          participantId: Number(currentUser.id),
        },
        this.getAuthorizedOptions(),
      )
      .pipe(map((message) => this.mapChatMessage(message)));
  }

  deleteConversationMessage(
    messageId: string,
  ): Observable<StudentServiceChatMessage> {
    const currentUser = this.getRequiredCurrentUser();

    return this.http
      .delete<StudentServiceChatMessageApiDto>(
        this.buildStudentServicesUrl(`/chat/messages/${messageId}`),
        {
          ...this.getAuthorizedOptions(),
          params: new HttpParams().set('participantId', currentUser.id),
        },
      )
      .pipe(map((message) => this.mapChatMessage(message)));
  }

  sendConversationImage(
    conversationId: string,
    image: File,
    content = '',
  ): Observable<StudentServiceChatMessage> {
    const currentUser = this.getRequiredCurrentUser();
    const formData = new FormData();
    formData.append('image', image);

    const authorizedOptions = this.getAuthorizedOptions();
    let params = new HttpParams()
      .set('conversationId', conversationId)
      .set('senderId', currentUser.id)
      .set('senderName', this.resolveUserDisplayName(currentUser));

    if (content.trim()) {
      params = params.set('content', content.trim());
    }

    return this.http
      .post<StudentServiceChatMessageApiDto>(
        this.buildStudentServicesUrl('/chat/messages/image'),
        formData,
        {
          ...authorizedOptions,
          headers: authorizedOptions.headers.delete('Content-Type'),
          params,
        },
      )
      .pipe(map((message) => this.mapChatMessage(message)));
  }

  private buildServicePayload(payload: StudentServiceFormValue) {
    const currentUser = this.getRequiredCurrentUser();

    return {
      category: this.toApiCategory(payload.categoryId),
      coverImageUrl: payload.coverImage.trim(),
      deliveryMode: this.toApiDeliveryMode(payload.deliveryMode),
      description: payload.description.trim(),
      featured: false,
      location: payload.location.trim(),
      priceLabel: payload.priceLabel.trim(),
      providerAvatar: this.resolveUserAvatar(currentUser),
      providerDepartment: this.resolveUserDepartment(currentUser),
      providerHeadline: this.resolveUserHeadline(currentUser),
      providerId: Number(currentUser.id),
      providerName: this.resolveUserDisplayName(currentUser),
      shortDescription: payload.shortDescription.trim(),
      tags: payload.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      title: payload.title.trim(),
    };
  }

  private mapService(service: StudentServiceApiDto): StudentService {
    return {
      categoryId: this.fromApiCategory(service.category),
      coverImage: service.coverImageUrl,
      createdAt: service.createdAt,
      deliveryMode: this.fromApiDeliveryMode(service.deliveryMode),
      description: service.description,
      featured: service.featured,
      id: String(service.id),
      location: service.location,
      priceLabel: service.priceLabel,
      providerAvatar: service.providerAvatar,
      providerDepartment: service.providerDepartment,
      providerHeadline: service.providerHeadline,
      providerId: String(service.providerId),
      providerName: service.providerName,
      rating: Number(service.rating),
      requestCount: service.requestCount,
      reviewCount: service.reviewCount,
      moderationStatus: this.fromApiModerationStatus(service.moderationStatus),
      moderatedAt: service.moderatedAt,
      shortDescription: service.shortDescription,
      slug: service.slug,
      tags: service.tags,
      title: service.title,
      updatedAt: service.updatedAt,
    };
  }

  private mapRequest(request: StudentServiceRequestApiDto): StudentServiceRequest {
    return {
      budgetLabel: request.budgetLabel,
      createdAt: request.createdAt,
      id: String(request.id),
      message: request.message,
      preferredDate: request.preferredDate,
      providerId: String(request.providerId),
      providerName: request.providerName,
      requesterAvatar: request.requesterAvatar,
      requesterDepartment: request.requesterDepartment,
      requesterId: String(request.requesterId),
      requesterName: request.requesterName,
      serviceCategoryId: this.fromApiCategory(request.serviceCategory),
      serviceId: String(request.serviceId),
      serviceTitle: request.serviceTitle,
      status: this.fromApiRequestStatus(request.status),
    };
  }

  private mapConversation(
    conversation: StudentServiceConversationApiDto,
  ): StudentServiceConversation {
    return {
      active: conversation.active,
      id: String(conversation.id),
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      otherParticipantId: String(conversation.otherParticipantId),
      otherParticipantName: conversation.otherParticipantName,
      requestId: String(conversation.requestId),
      serviceId: String(conversation.serviceId),
      serviceTitle: conversation.serviceTitle,
    };
  }

  private mapChatMessage(
    message: StudentServiceChatMessageApiDto,
  ): StudentServiceChatMessage {
    return {
      content: message.content,
      conversationId: String(message.conversationId),
      deletedAt: message.deletedAt ?? null,
      editedAt: message.editedAt ?? null,
      id: String(message.id),
      imageUrl: message.imageUrl ?? null,
      senderId: String(message.senderId),
      senderName: message.senderName,
      sentAt: message.sentAt,
    };
  }

  private getAuthorizedOptions(): {
    headers: HttpHeaders;
    withCredentials: boolean;
  } {
    const session = loadAuthSession();
    const accessToken = session?.accessToken?.trim();
    const headers = accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : new HttpHeaders();

    return {
      headers,
      withCredentials: environment.studentServices.withCredentials,
    };
  }

  private getRequiredCurrentUser() {
    const currentUser = this.userService.currentUser();
    if (!currentUser?.id) {
      throw new Error('An authenticated user is required to access student services.');
    }

    return currentUser;
  }

  private getRequiredCurrentUserId(required = true): string | null {
    const id = this.userService.currentUser()?.id?.trim() ?? '';
    if (!id && required) {
      throw new Error('An authenticated user is required to access student services.');
    }
    return id || null;
  }

  private resolveUserDisplayName(
    currentUser: NonNullable<ReturnType<UserService['currentUser']>>,
  ): string {
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    if (fullName) {
      return fullName;
    }

    return currentUser.email?.split('@')[0]?.trim() || 'ESPRIT Student';
  }

  private resolveUserAvatar(
    currentUser: NonNullable<ReturnType<UserService['currentUser']>>,
  ): string {
    return (
      currentUser.avatarUrl?.trim() ||
      createAvatarDataUrl(this.resolveUserDisplayName(currentUser))
    );
  }

  private resolveUserDepartment(
    currentUser: NonNullable<ReturnType<UserService['currentUser']>>,
  ): string {
    return currentUser.department?.trim() || 'ESPRIT Student';
  }

  private resolveUserHeadline(
    currentUser: NonNullable<ReturnType<UserService['currentUser']>>,
  ): string {
    return currentUser.bio?.trim() || 'Helpful ESPRIT student service provider.';
  }

  private buildStudentServicesUrl(path: string): string {
    return joinUrl(
      environment.studentServices.apiBaseUrl,
      `${environment.studentServices.basePath}${path}`,
    );
  }

  private toApiCategory(categoryId: StudentService['categoryId']): ApiServiceCategory {
    return categoryId.replace('-', '_').toUpperCase() as ApiServiceCategory;
  }

  private fromApiCategory(category: ApiServiceCategory): StudentService['categoryId'] {
    switch (category) {
      case 'ACADEMIC':
        return 'academic';
      case 'MOBILITY':
        return 'mobility';
      case 'ERRANDS':
        return 'errands';
      case 'CREATIVE':
        return 'creative';
      case 'TECH':
        return 'tech';
      case 'WELLBEING':
        return 'wellbeing';
    }
  }

  private toApiDeliveryMode(
    deliveryMode: StudentService['deliveryMode'],
  ): ApiDeliveryMode {
    switch (deliveryMode) {
      case 'online':
        return 'ONLINE';
      case 'on-site':
        return 'ON_SITE';
      case 'hybrid':
        return 'HYBRID';
    }
  }

  private fromApiDeliveryMode(
    deliveryMode: ApiDeliveryMode,
  ): StudentService['deliveryMode'] {
    switch (deliveryMode) {
      case 'ONLINE':
        return 'online';
      case 'ON_SITE':
        return 'on-site';
      case 'HYBRID':
        return 'hybrid';
    }
  }

  private toApiRequestStatus(
    status: StudentServiceRequest['status'],
  ): ApiRequestStatus {
    return status.toUpperCase() as ApiRequestStatus;
  }

  private fromApiRequestStatus(
    status: ApiRequestStatus,
  ): StudentServiceRequest['status'] {
    return status.toLowerCase() as StudentServiceRequest['status'];
  }

  private toApiModerationStatus(
    status: ServiceModerationStatus,
  ): ApiModerationStatus {
    return status.toUpperCase() as ApiModerationStatus;
  }

  private fromApiModerationStatus(
    status: ApiModerationStatus,
  ): ServiceModerationStatus {
    return status.toLowerCase() as ServiceModerationStatus;
  }
}
