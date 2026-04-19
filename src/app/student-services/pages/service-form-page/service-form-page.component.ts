import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthApiService } from '../../../user-security/services/auth-api.service';
import {
  ServiceCategory,
  StudentServiceFormValue,
} from '../../models/student-service.model';
import { StudentServicesApiService } from '../../services/student-services-api.service';

@Component({
  standalone: false,
  selector: 'app-service-form-page',
  templateUrl: './service-form-page.component.html',
})
export class ServiceFormPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authApiService = inject(AuthApiService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);

  readonly backendFieldErrors = signal<Record<string, string>>({});
  readonly categories = signal<ServiceCategory[]>([]);
  readonly formFeedback = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly isUploadingCover = signal(false);
  readonly selectedCoverImageName = signal('');
  readonly selectedCoverImageFile = signal<File | null>(null);
  readonly coverImagePreviewUrl = signal('');
  readonly editingServiceId = this.route.snapshot.paramMap.get('id');
  readonly pageTitle = computed(() =>
    this.editingServiceId ? 'Edit service post' : 'Create service post',
  );
  readonly coverImagePreview = computed(
    () => this.coverImagePreviewUrl() || this.form.controls.coverImage.value.trim(),
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(8)]],
    shortDescription: ['', [Validators.required, Validators.minLength(20)]],
    categoryId: ['academic', Validators.required],
    priceLabel: ['', Validators.required],
    deliveryMode: ['online', Validators.required],
    location: ['', Validators.required],
    tags: ['', Validators.required],
    coverImage: [''],
  });

  constructor() {
    this.studentServicesApiService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
    });

    if (this.editingServiceId) {
      this.studentServicesApiService
        .getServiceById(this.editingServiceId)
        .subscribe((service) => {
          if (!service) {
            this.toastService.error('Service post not found.', 'Edit Unavailable');
            return;
          }

          this.form.patchValue({
            title: service.title,
            shortDescription: service.shortDescription,
            categoryId: service.categoryId,
            priceLabel: service.priceLabel,
            deliveryMode: service.deliveryMode,
            location: service.location,
            tags: service.tags.join(', '),
            coverImage: service.coverImage,
          });
          this.coverImagePreviewUrl.set('');
        });
    }
  }

  ngOnDestroy(): void {
    this.releaseCoverImagePreview();
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.backendFieldErrors.set({});
    this.formFeedback.set(null);

    if (this.form.invalid) {
      const message = 'Please complete the highlighted fields before publishing your service post.';
      this.formFeedback.set(message);
      this.toastService.error(message, 'Form Incomplete');
      return;
    }

    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    const basePayload = this.form.getRawValue() as StudentServiceFormValue;

    const payload$ = this.selectedCoverImageFile()
      ? this.studentServicesApiService
          .uploadCoverImage(this.selectedCoverImageFile() as File)
          .pipe(
            switchMap((uploadResult) => {
              this.isUploadingCover.set(false);
              this.form.controls.coverImage.setValue(uploadResult.imageUrl);
              const payload = {
                ...basePayload,
                coverImage: uploadResult.imageUrl,
              } satisfies StudentServiceFormValue;
              return of(payload);
            }),
          )
      : of(basePayload);

    if (this.selectedCoverImageFile()) {
      this.isUploadingCover.set(true);
    }

    payload$
      .pipe(
        switchMap((payload) =>
          this.editingServiceId
            ? this.studentServicesApiService.updateService(
                this.editingServiceId,
                payload,
              )
            : this.studentServicesApiService.createService(payload),
        ),
      )
      .subscribe({
      next: (service) => {
        if (!service) {
          this.formFeedback.set('Unable to save this service post.');
          this.toastService.error(
            'Unable to save this service post.',
            'Save Failed',
          );
          this.isSaving.set(false);
          return;
        }

        this.toastService.success(
          this.editingServiceId
            ? 'Service post updated and sent back for admin review.'
            : 'Service post created and sent for admin review.',
          'Save Complete',
        );
        this.clearCoverImage(false);
        void this.router.navigate(['/student-services/my-posts']);
      },
      error: (error) => {
        this.isUploadingCover.set(false);
        const fieldErrors = this.extractFieldErrors(error);
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to save this service post right now.',
        );
        this.backendFieldErrors.set(fieldErrors);
        this.formFeedback.set(message);
        this.toastService.error(message, 'Save Failed');
        this.isSaving.set(false);
      },
      complete: () => {
        this.isUploadingCover.set(false);
        this.isSaving.set(false);
      },
    });
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toastService.error(
        'Please select a valid image file.',
        'Invalid Image',
      );
      if (input) {
        input.value = '';
      }
      return;
    }

    this.releaseCoverImagePreview();
    this.selectedCoverImageFile.set(file);
    this.selectedCoverImageName.set(file.name);
    this.coverImagePreviewUrl.set(URL.createObjectURL(file));
  }

  clearCoverImage(clearStoredImage = true): void {
    if (clearStoredImage) {
      this.form.controls.coverImage.setValue('');
    }
    this.selectedCoverImageFile.set(null);
    this.selectedCoverImageName.set('');
    this.releaseCoverImagePreview();
  }

  controlHasError(controlName: keyof StudentServiceFormValue): boolean {
    const control = this.form.controls[controlName];
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  controlError(controlName: keyof StudentServiceFormValue): string | null {
    const backendError = this.backendFieldErrors()[controlName];
    if (backendError) {
      return backendError;
    }

    const control = this.form.controls[controlName];
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength']['requiredLength'];
      return `Please enter at least ${requiredLength} characters.`;
    }

    return 'Please check this field.';
  }

  private releaseCoverImagePreview(): void {
    const previewUrl = this.coverImagePreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    this.coverImagePreviewUrl.set('');
  }

  private extractFieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof HttpErrorResponse)) {
      return {};
    }

    const payload = error.error;
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const fieldErrors = (payload as Record<string, unknown>)['fieldErrors'];
    if (!fieldErrors || typeof fieldErrors !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(fieldErrors as Record<string, unknown>).filter(
        ([, value]) => typeof value === 'string' && value.trim(),
      ),
    ) as Record<string, string>;
  }
}

