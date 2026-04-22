import { Component, computed, inject, signal } from '@angular/core';
import { ToastService } from '../../../shared/services/toast.service';
import { StudentServiceRequest } from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';

@Component({
  standalone: false,
  selector: 'app-provider-service-requests-page',
  templateUrl: './provider-service-requests-page.component.html',
})
export class ProviderServiceRequestsPageComponent {
  private readonly toastService = inject(ToastService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);

  readonly requests = signal<StudentServiceRequest[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = 4;
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.requests().length / this.pageSize)),
  );
  readonly paginatedRequests = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.requests().slice(startIndex, startIndex + this.pageSize);
  });

  constructor() {
    this.loadRequests();
  }

  acceptRequest(requestId: string): void {
    this.studentServicesApiService
      .updateRequestStatus(requestId, 'accepted')
      .subscribe((request) => {
        if (!request) {
          this.toastService.error('Unable to accept this request.', 'Update Failed');
          return;
        }

        this.toastService.success('Request accepted successfully.', 'Request Accepted');
        this.loadRequests();
      });
  }

  declineRequest(requestId: string): void {
    this.studentServicesApiService
      .updateRequestStatus(requestId, 'declined')
      .subscribe((request) => {
        if (!request) {
          this.toastService.error('Unable to decline this request.', 'Update Failed');
          return;
        }

        this.toastService.info('Request declined.', 'Request Updated');
        this.loadRequests();
      });
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  private loadRequests(): void {
    this.studentServicesApiService.getProviderRequests().subscribe((requests) => {
      this.requests.set(requests);
      this.currentPage.set(1);
    });
  }
}

