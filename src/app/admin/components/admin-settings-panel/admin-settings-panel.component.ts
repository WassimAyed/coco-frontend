import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ImagePlus, Save, Settings2 } from 'lucide-angular';
import { ToastService } from '../../../shared/services/toast.service';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import {
  PasswordUpdatePayload,
  ToggleTwoFactorPayload,
  UserUpdatePayload,
} from '../../../user-security/models/auth-api.model';
import { UserProfile } from '../../../user-security/models/user.model';
import { AuthApiService } from '../../../user-security/services/auth-api.service';
import { ProfileImageUploadService } from '../../../user-security/services/profile-image-upload.service';
import { UserService } from '../../../user-security/services/user.service';

@Component({
  standalone: true,
  selector: 'app-admin-settings-panel',
  templateUrl: './admin-settings-panel.component.html',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
})
export class AdminSettingsPanelComponent implements OnChanges, OnDestroy {
  private readonly authApiService = inject(AuthApiService);
  private readonly fb = inject(FormBuilder);
  private readonly profileImageUploadService = inject(
    ProfileImageUploadService,
  );
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  @Input() adminUser: UserProfile | null = null;

  readonly ImagePlusIcon = ImagePlus;
  readonly SaveIcon = Save;
  readonly SettingsIcon = Settings2;

  readonly isSavingImage = signal(false);
  readonly isSavingSettings = signal(false);
  readonly isUpdatingPassword = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly selectedProfileImageFile = signal<File | null>(null);
  readonly profileImagePreviewUrl = signal<string | null>(null);
  readonly selectedProfileImageFileName = computed(() => this.selectedProfileImageFile()?.name ?? '',);
  readonly effectiveProfileImageUrl = computed(
    () =>
      this.profileImagePreviewUrl() ||
      this.adminUser?.avatarUrl ||
      createAvatarDataUrl(this.displayName),
  );

  readonly settingsForm = this.fb.nonNullable.group({
    twoFactorEnabled: [false],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    confirmPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    oldPassword: ['', Validators.required],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adminUser'] && this.adminUser) {
      this.settingsForm.patchValue({
        twoFactorEnabled: this.adminUser.twoFactorEnabled ?? false,
      });
    }
  }

  ngOnDestroy(): void {
    this.releaseProfileImagePreviewUrl();
  }

  get displayName(): string {
    if (!this.adminUser) {
      return 'Admin User';
    }

    return `${this.adminUser.firstName} ${this.adminUser.lastName}`.trim();
  }

  get passwordsMatch(): boolean {
    return (
      this.passwordForm.controls.newPassword.value ===
      this.passwordForm.controls.confirmPassword.value
    );
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.saveMessage.set('Please choose a valid image file.');
      this.toastService.error(
        'Please choose a valid image file.',
        'Invalid Image',
      );
      if (input) {
        input.value = '';
      }
      return;
    }

    this.releaseProfileImagePreviewUrl();
    this.selectedProfileImageFile.set(file);
    this.profileImagePreviewUrl.set(URL.createObjectURL(file));
    this.saveMessage.set(
      'Image selected. Save it to update your admin profile photo.',
    );
  }

  clearSelectedProfileImage(): void {
    this.selectedProfileImageFile.set(null);
    this.releaseProfileImagePreviewUrl();
  }

  saveProfileImage(): void {
    if (this.isSavingImage() || !this.selectedProfileImageFile() || !this.adminUser) {
      return;
    }

    this.isSavingImage.set(true);
    this.saveMessage.set('Uploading your new admin image...');
    void this.persistProfileImage();
  }

  saveSettings(): void {
    if (this.isSavingSettings()) {
      return;
    }

    this.isSavingSettings.set(true);
    this.saveMessage.set(null);

    const payload: ToggleTwoFactorPayload = {
      enabled: this.settingsForm.controls.twoFactorEnabled.value,
    };

    void this.userService
      .setTwoFactorEnabled(payload)
      .then((result) => {
        this.userService.updateProfile({
          twoFactorEnabled: payload.enabled,
        });
        this.saveMessage.set(
          result.message ?? 'Two-factor authentication updated successfully.',
        );
        this.toastService.success(
          result.message ?? 'Two-factor authentication updated successfully.',
          'Security Saved',
        );
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to update two-factor authentication right now.',
        );
        this.saveMessage.set(message);
        this.toastService.error(message, 'Security Update Failed');
      })
      .finally(() => {
        this.isSavingSettings.set(false);
      });
  }

  updatePassword(): void {
    if (this.isUpdatingPassword()) {
      return;
    }

    this.passwordForm.markAllAsTouched();
    this.saveMessage.set(null);

    if (this.passwordForm.invalid || !this.passwordsMatch) {
      return;
    }

    this.isUpdatingPassword.set(true);

    const payload: PasswordUpdatePayload = {
      newPassword: this.passwordForm.controls.newPassword.value,
      oldPassword: this.passwordForm.controls.oldPassword.value,
    };

    void this.userService
      .updatePasswordRequest(payload)
      .then(() => {
        this.passwordForm.reset();
        this.saveMessage.set('Password updated successfully.');
        this.toastService.success(
          'Password updated successfully.',
          'Password Changed',
        );
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to update your password right now.',
        );
        this.saveMessage.set(message);
        this.toastService.error(message, 'Password Update Failed');
      })
      .finally(() => {
        this.isUpdatingPassword.set(false);
      });
  }

  private async persistProfileImage(): Promise<void> {
    try {
      const uploadedImageUrl =
        await this.profileImageUploadService.uploadProfileImage(
          this.selectedProfileImageFile() as File,
        );

      const payload: UserUpdatePayload = {
        imageUrl: uploadedImageUrl,
        lastname: this.adminUser?.lastName ?? '',
        username: this.adminUser?.firstName ?? '',
      };

      await this.userService.saveCurrentUserProfile(payload);
      this.clearSelectedProfileImage();
      this.saveMessage.set('Admin profile image updated successfully.');
      this.toastService.success(
        'Admin profile image updated successfully.',
        'Image Updated',
      );
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to update the admin profile image right now.',
      );
      this.saveMessage.set(message);
      this.toastService.error(message, 'Image Update Failed');
    } finally {
      this.isSavingImage.set(false);
    }
  }

  private releaseProfileImagePreviewUrl(): void {
    const previewUrl = this.profileImagePreviewUrl();
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    this.profileImagePreviewUrl.set(null);
  }
}

