import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ServiceCategory,
  StudentService,
  StudentServiceFilters,
} from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  standalone: false,
  selector: 'app-services-marketplace-page',
  templateUrl: './services-marketplace-page.component.html',
})
export class ServicesMarketplacePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);
  private readonly userService = inject(UserService);
  readonly categories = signal<ServiceCategory[]>([]);
  readonly isAuthenticated = this.userService.isAuthenticated;
  readonly myServices = signal<StudentService[]>([]);
  readonly services = signal<StudentService[]>([]);
  readonly currentPage = signal(1);
  readonly isLoading = signal(true);
  readonly pageSize = 4;
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.services().length / this.pageSize)),
  );
  readonly paginatedServices = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.services().slice(startIndex, startIndex + this.pageSize);
  });
  readonly highlightedCount = computed(
    () => this.services().filter((service) => service.featured).length,
  );
  readonly categoryLookup = computed(() =>
    new Map(this.categories().map((category) => [category.id, category])),
  );

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    categoryId: ['all'],
    deliveryMode: ['all'],
    minRating: [0],
    featuredOnly: [false],
  });

  constructor() {
    this.studentServicesApiService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
    });

    this.loadMyServices();

    this.filtersForm.valueChanges.subscribe(() => {
      this.loadServices();
    });

    this.loadServices();
  }

  resetFilters(): void {
    this.filtersForm.setValue({
      search: '',
      categoryId: 'all',
      deliveryMode: 'all',
      minRating: 0,
      featuredOnly: false,
    });
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  getCategory(service: StudentService): ServiceCategory | undefined {
    return this.categoryLookup().get(service.categoryId);
  }

  deleteService(serviceId: string): void {
    this.studentServicesApiService.deleteService(serviceId).subscribe((deleted) => {
      if (!deleted) {
        this.toastService.error('Unable to delete this post.', 'Delete Failed');
        return;
      }

      this.toastService.success('Service post deleted.', 'Post Removed');
      this.loadMyServices();
      this.loadServices();
    });
  }

  private loadServices(): void {
    this.isLoading.set(true);

    const filters = this.filtersForm.getRawValue() as StudentServiceFilters;
    this.studentServicesApiService.getServices(filters).subscribe({
      next: (services) => {
        this.services.set(services);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error(
          'Unable to load student services right now.',
          'Services Unavailable',
        );
        this.isLoading.set(false);
      },
    });
  }

  private loadMyServices(): void {
    if (!this.isAuthenticated()) {
      this.myServices.set([]);
      return;
    }

    this.studentServicesApiService.getMyServices().subscribe({
      next: (services) => {
        this.myServices.set(services);
      
      },
      error: () => {
        this.myServices.set([]);
      },
    });
  }
}
