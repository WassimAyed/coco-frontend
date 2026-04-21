import { Component, computed, inject, signal } from '@angular/core';
import {
  ServiceCategory,
  ServiceRecommendation,
  StudentService,
} from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';

@Component({
  standalone: false,
  selector: 'app-service-recommendations-page',
  templateUrl: './service-recommendations-page.component.html',
})
export class ServiceRecommendationsPageComponent {
  private readonly studentServicesApiService = inject(StudentServicesApiService);

  readonly recommendations = signal<ServiceRecommendation[]>([]);
  readonly services = signal<StudentService[]>([]);
  readonly categories = signal<ServiceCategory[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = 4;
  readonly servicesLookup = computed(
    () => new Map(this.services().map((service) => [service.id, service])),
  );
  readonly categoriesLookup = computed(
    () => new Map(this.categories().map((category) => [category.id, category])),
  );
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.recommendations().length / this.pageSize)),
  );
  readonly paginatedRecommendations = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.recommendations().slice(startIndex, startIndex + this.pageSize);
  });

  constructor() {
    this.studentServicesApiService.getRecommendations().subscribe((items) => {
      this.recommendations.set(items);
      this.currentPage.set(1);
    });

    this.studentServicesApiService.getServices().subscribe((services) => {
      this.services.set(services);
    });

    this.studentServicesApiService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  getService(recommendation: ServiceRecommendation): StudentService | undefined {
    return this.servicesLookup().get(recommendation.serviceId);
  }

  getCategory(recommendation: ServiceRecommendation): ServiceCategory | undefined {
    const service = this.getService(recommendation);
    return service
      ? this.categoriesLookup().get(service.categoryId)
      : undefined;
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }
}

