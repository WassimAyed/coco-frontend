import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../../user-security/services/user.service';
import {
  ServiceCategory,
  ServiceReview,
  StudentService,
  StudentServiceRequest,
  StudentServiceRequestFormValue,
} from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';

@Component({
  standalone: false,
  selector: 'app-service-detail-page',
  templateUrl: './service-detail-page.component.html',
})
export class ServiceDetailPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);
  private readonly userService = inject(UserService);

  readonly service = signal<StudentService | null>(null);
  readonly reviews = signal<ServiceReview[]>([]);
  readonly categories = signal<ServiceCategory[]>([]);
  readonly currentRequest = signal<StudentServiceRequest | null>(null);
  readonly isSubmittingRequest = signal(false);
  readonly isAuthenticated = this.userService.isAuthenticated;
  readonly category = computed(() => {
    const service = this.service();
    return service
      ? this.categories().find((item) => item.id === service.categoryId) ?? null
      : null;
  });
  readonly isOwner = computed(() => {
    const service = this.service();
    const currentUserId = this.userService.currentUser()?.id?.trim();
    return !!service && !!currentUserId && service.providerId === currentUserId;
  });
  readonly canMessageProvider = computed(
    () => this.currentRequest()?.status === 'accepted',
  );
  readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(20)]],
    preferredDate: ['', Validators.required],
    budgetLabel: ['', Validators.required],
  });

  constructor() {
    const serviceId = this.route.snapshot.paramMap.get('id') ?? '';

    this.studentServicesApiService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
    });

    this.studentServicesApiService.getServiceById(serviceId).subscribe((service) => {
      if (!service) {
        this.toastService.error('Service post not found.', 'Missing Service');
        return;
      }

      this.service.set(service);
    });

    this.loadCurrentRequest(serviceId);

    this.studentServicesApiService
      .getReviewsForService(serviceId)
      .subscribe((reviews) => {
        this.reviews.set(reviews);
      });
  }

  submitRequest(): void {
    this.form.markAllAsTouched();

    const service = this.service();
    if (!this.isAuthenticated()) {
      this.toastService.info(
        'Please log in before sending a service request.',
        'Login Required',
      );
      return;
    }

    if (this.isOwner()) {
      this.toastService.info(
        'You cannot send a request to your own service post.',
        'Owner Action Blocked',
      );
      return;
    }

    if (!service || this.form.invalid || this.isSubmittingRequest()) {
      return;
    }

    if (this.currentRequest()) {
      this.toastService.info(
        'You already sent a request for this service.',
        'Request Already Sent',
      );
      return;
    }

    this.isSubmittingRequest.set(true);
    const payload = this.form.getRawValue() as StudentServiceRequestFormValue;

    this.studentServicesApiService
      .createRequestForService(service, payload)
      .subscribe({
        next: (request) => {
          this.currentRequest.set(request);
          this.toastService.success(
            'Your request was sent successfully.',
            'Request Sent',
          );
          this.form.reset({
            budgetLabel: '',
            message: '',
            preferredDate: '',
          });
        },
        error: () => {
          this.toastService.error(
            'Unable to send your request right now.',
            'Request Failed',
          );
          this.isSubmittingRequest.set(false);
        },
        complete: () => {
          this.isSubmittingRequest.set(false);
        },
      });
  }

  private loadCurrentRequest(serviceId: string): void {
    if (!this.isAuthenticated()) {
      this.currentRequest.set(null);
      return;
    }

    this.studentServicesApiService
      .getMyRequestForService(serviceId)
      .subscribe({
        next: (request) => {
          this.currentRequest.set(request ?? null);
        },
        error: () => {
          this.currentRequest.set(null);
        },
      });
  }
}

