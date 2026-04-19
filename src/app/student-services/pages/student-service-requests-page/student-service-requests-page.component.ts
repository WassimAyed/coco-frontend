import { Component, inject, signal } from '@angular/core';
import { StudentServiceRequest } from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';

@Component({
  standalone: false,
  selector: 'app-student-service-requests-page',
  templateUrl: './student-service-requests-page.component.html',
})
export class StudentServiceRequestsPageComponent {
  private readonly studentServicesApiService = inject(StudentServicesApiService);

  readonly requests = signal<StudentServiceRequest[]>([]);

  constructor() {
    this.studentServicesApiService.getMyRequests().subscribe((requests) => {
      this.requests.set(requests);
    });
  }
}

