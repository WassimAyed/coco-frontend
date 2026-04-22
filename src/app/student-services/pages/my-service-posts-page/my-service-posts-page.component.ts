import { Component, computed, inject, signal } from '@angular/core';
import { ToastService } from '../../../shared/services/toast.service';
import { ServiceCategory, StudentService } from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';

@Component({
  standalone: false,
  selector: 'app-my-service-posts-page',
  templateUrl: './my-service-posts-page.component.html',
})
export class MyServicePostsPageComponent {
  private readonly toastService = inject(ToastService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);

  readonly services = signal<StudentService[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = 4;
  readonly categories = signal<ServiceCategory[]>([]);
  readonly categoryLookup = computed(
    () => new Map(this.categories().map((category) => [category.id, category])),
  );
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.services().length / this.pageSize)),
  );
  readonly paginatedServices = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.services().slice(startIndex, startIndex + this.pageSize);
  });

  constructor() {
    this.studentServicesApiService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
    });

    this.loadMyServices();
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
    });
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  private loadMyServices(): void {
    this.studentServicesApiService.getMyServices().subscribe((services) => {
      this.services.set(services);
      this.currentPage.set(1);
    });
  }
}

