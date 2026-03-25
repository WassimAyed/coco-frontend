import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  Bell,
  BookOpen,
  Clock3,
  DatabaseZap,
  MessageCircleMore,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-angular';
import {
  createConversations,
  PROFILE_ACTIVITY_FEED,
  PROFILE_SECTIONS,
  PROFILE_SHORTCUTS,
  ProfileSidebarSection
} from '../../data/profile-shell.data';
import { ChatConversation, ProfileSectionId } from '../../models/profile-shell.model';
import { AuthApiService } from '../../services/auth-api.service';
import { ProfileImageUploadService } from '../../services/profile-image-upload.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html'
})
export class UserProfilePageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly profileImageUploadService = inject(ProfileImageUploadService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

  readonly ShieldCheckIcon = ShieldCheck;
  readonly SparklesIcon = Sparkles;
  readonly UserRoundIcon = UserRound;
  readonly BookOpenIcon = BookOpen;
  readonly SettingsIcon = Settings2;
  readonly MessageCircleIcon = MessageCircleMore;
  readonly SaveIcon = Save;
  readonly SendIcon = Send;
  readonly BellIcon = Bell;
  readonly Clock3Icon = Clock3;
  readonly DatabaseZapIcon = DatabaseZap;

  readonly user = computed(() => this.userService.currentUser());
  readonly sections = PROFILE_SECTIONS;
  readonly shortcuts = PROFILE_SHORTCUTS;
  readonly activityFeed = PROFILE_ACTIVITY_FEED;
  readonly activeSection = signal<ProfileSectionId>('profile');
  readonly saveMessage = signal<string | null>(null);
  readonly isSavingProfile = signal(false);
  readonly isUploadingProfileImage = signal(false);
  readonly isSavingSettings = signal(false);
  readonly isUpdatingPassword = signal(false);
  readonly selectedProfileImageFile = signal<File | null>(null);
  readonly selectedProfileImageFileName = computed(
    () => this.selectedProfileImageFile()?.name ?? '',
  );
  readonly profileImagePreviewUrl = signal<string | null>(null);
  readonly effectiveProfileImageUrl = computed(
    () => this.profileImagePreviewUrl() || this.user()?.avatarUrl || '',
  );
  readonly messageDraft = signal('');
  readonly chatSearch = signal('');
  readonly conversations = signal<ChatConversation[]>([]);
  readonly selectedConversationId = signal<string | null>(null);
  readonly selectedSectionMeta = computed<ProfileSidebarSection | undefined>(() =>
    this.sections.find((section) => section.id === this.activeSection())
  );
  readonly sortedConversations = computed(() => {
    const selectedId = this.selectedConversationId();
    const query = this.chatSearch().trim().toLowerCase();
    const conversations = this.conversations().filter((conversation) => {
      if (!query) {
        return true;
      }

      return (
        conversation.name.toLowerCase().includes(query) ||
        conversation.role.toLowerCase().includes(query) ||
        conversation.lastMessage.toLowerCase().includes(query) ||
        conversation.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    return [...conversations].sort((left, right) => {
      if (left.id === selectedId) {
        return -1;
      }
      if (right.id === selectedId) {
        return 1;
      }
      return right.unreadCount - left.unreadCount;
    });
  });
  readonly selectedConversation = computed(() =>
    this.conversations().find((conversation) => conversation.id === this.selectedConversationId()) ?? null
  );

  readonly profileForm = this.fb.nonNullable.group({
    email: [{ disabled: true, value: '' }, [Validators.required, Validators.email]],
    imageUrl: [''],
    lastname: ['', Validators.required],
    username: ['', Validators.required],
  });

  readonly settingsForm = this.fb.nonNullable.group({
    twoFactorEnabled: [false],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    confirmPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    oldPassword: ['', Validators.required],
  });

  constructor() {
    this.loadFakeConversations();
    void this.loadProfile();

    effect(() => {
      const profile = this.user();

      if (!profile) {
        return;
      }

      this.profileForm.patchValue({
        email: profile.email,
        imageUrl: this.toEditableImageUrl(profile.avatarUrl),
        lastname: profile.lastName,
        username: profile.firstName,
      });

      this.settingsForm.patchValue({
        twoFactorEnabled: profile.twoFactorEnabled ?? false,
      });

      this.loadFakeConversations();
    });
  }

  ngOnDestroy(): void {
    this.releaseProfileImagePreviewUrl();
  }

  selectSection(sectionId: ProfileSectionId): void {
    this.activeSection.set(sectionId);
    this.saveMessage.set(null);

    if (sectionId === 'chat') {
      this.loadFakeConversations();
    }

    if (sectionId === 'chat' && !this.selectedConversationId()) {
      this.selectedConversationId.set(this.conversations()[0]?.id ?? null);
    }
  }

  selectConversation(conversationId: string): void {
    this.focusConversation(conversationId);
  }

  private focusConversation(conversationId: string): void {
    this.selectedConversationId.set(conversationId);
    this.activeSection.set('chat');
    this.saveMessage.set(null);
    this.conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  }

  get passwordsMatch(): boolean {
    return (
      this.passwordForm.controls.newPassword.value ===
      this.passwordForm.controls.confirmPassword.value
    );
  }

  saveProfile(): void {
    if (this.isSavingProfile()) {
      return;
    }

    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      return;
    }

    this.isSavingProfile.set(true);
    this.saveMessage.set(null);
    void this.persistProfileChanges();
  }

  saveSettings(): void {
    if (this.isSavingSettings()) {
      return;
    }

    this.isSavingSettings.set(true);
    this.saveMessage.set(null);

    void this.userService
      .setTwoFactorEnabled({
        enabled: this.settingsForm.controls.twoFactorEnabled.value,
      })
      .then((result) => {
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

    void this.userService
      .updatePasswordRequest({
        newPassword: this.passwordForm.controls.newPassword.value,
        oldPassword: this.passwordForm.controls.oldPassword.value,
      })
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

  sendMessage(): void {
    const content = this.messageDraft().trim();
    const conversationId = this.selectedConversationId();

    if (!content || !conversationId) {
      return;
    }

    this.conversations.update((conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          lastMessage: content,
          lastMessageTime: 'now',
          messages: [
            ...conversation.messages,
            {
              author: 'me',
              content,
              id: `${conversation.id}-${conversation.messages.length + 1}`,
              timestamp: 'now'
            }
          ],
          unreadCount: 0
        };
      })
    );

    this.messageDraft.set('');
    this.focusConversation(conversationId);
  }

  onDraftChange(event: Event): void {
    this.messageDraft.set((event.target as HTMLInputElement).value);
  }

  onChatSearchChange(event: Event): void {
    this.chatSearch.set((event.target as HTMLInputElement).value);
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.saveMessage.set('Please choose a valid image file.');
      this.toastService.error('Please choose a valid image file.', 'Invalid Image');
      if (input) {
        input.value = '';
      }
      return;
    }

    this.releaseProfileImagePreviewUrl();
    this.selectedProfileImageFile.set(file);
    this.profileImagePreviewUrl.set(URL.createObjectURL(file));
    this.saveMessage.set(
      'Image selected. Save your profile to upload it to storage.',
    );
  }

  clearSelectedProfileImage(resetInput = false): void {
    this.selectedProfileImageFile.set(null);
    this.releaseProfileImagePreviewUrl();

    if (resetInput) {
      this.profileForm.controls.imageUrl.setValue(
        this.toEditableImageUrl(this.user()?.avatarUrl),
      );
    }
  }

  loadFakeConversations(force = false): void {
    const profile = this.user();

    if (!profile) {
      return;
    }

    if (!force && this.conversations().length > 0) {
      return;
    }

    const seededConversations = createConversations(profile);
    this.conversations.set(seededConversations);

    if (!this.selectedConversationId() || force) {
      this.selectedConversationId.set(seededConversations[0]?.id ?? null);
    }
  }

  private async loadProfile(): Promise<void> {
    try {
      await this.userService.loadCurrentUserProfile();
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to load your profile details right now.',
      );
      this.saveMessage.set(message);
      this.toastService.error(message, 'Profile Load Failed');
    }
  }

  private async persistProfileChanges(): Promise<void> {
    try {
      let imageUrl = this.normalizeSubmittedImageUrl(
        this.profileForm.controls.imageUrl.value,
      );

      if (this.selectedProfileImageFile()) {
        this.isUploadingProfileImage.set(true);
        this.saveMessage.set('Uploading your profile image...');
        imageUrl = await this.profileImageUploadService.uploadProfileImage(
          this.selectedProfileImageFile() as File,
        );
        this.profileForm.controls.imageUrl.setValue(imageUrl);
      }

      await this.userService.saveCurrentUserProfile({
        imageUrl,
        lastname: this.profileForm.controls.lastname.value.trim(),
        username: this.profileForm.controls.username.value.trim(),
      });

      this.clearSelectedProfileImage();
      this.saveMessage.set('Profile updated successfully.');
      this.toastService.success('Profile updated successfully.', 'Profile Saved');
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to update your profile right now.',
      );
      this.saveMessage.set(message);
      this.toastService.error(message, 'Profile Update Failed');
    } finally {
      this.isUploadingProfileImage.set(false);
      this.isSavingProfile.set(false);
    }
  }

  private toEditableImageUrl(value: string | null | undefined): string {
    const normalizedValue = value?.trim() ?? '';
    return this.isGeneratedAvatarDataUrl(normalizedValue) ? '' : normalizedValue;
  }

  private normalizeSubmittedImageUrl(value: string | null | undefined): string {
    const normalizedValue = value?.trim() ?? '';
    return this.isGeneratedAvatarDataUrl(normalizedValue) ? '' : normalizedValue;
  }

  private isGeneratedAvatarDataUrl(value: string): boolean {
    return value.startsWith('data:image/svg+xml');
  }

  private releaseProfileImagePreviewUrl(): void {
    const previewUrl = this.profileImagePreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    this.profileImagePreviewUrl.set(null);
  }
}
