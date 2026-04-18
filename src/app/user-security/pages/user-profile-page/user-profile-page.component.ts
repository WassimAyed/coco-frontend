import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BellRing,
  Bell,
  BookOpen,
  Clock3,
  DatabaseZap,
  ImagePlus,
  MessageCircleMore,
  Pencil,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-angular';
import { Subscription, firstValueFrom, interval } from 'rxjs';
import {
  PROFILE_ACTIVITY_FEED,
  PROFILE_SECTIONS,
  ProfileSidebarSection,
} from '../../data/profile-shell.data';
import {
  ChatConversation,
  ChatMessage,
  ProfileSectionId,
  UserSignal,
} from '../../models/profile-shell.model';
import { AuthApiService } from '../../services/auth-api.service';
import { ProfileImageUploadService } from '../../services/profile-image-upload.service';
import { SignalApiService } from '../../services/signal-api.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import {
  ServiceCategory,
  StudentService,
  StudentServiceChatMessage,
  StudentServiceChatTypingIndicator,
  StudentServiceRequest,
} from '../../../student-services/models/student-service.model';
import { StudentServicesApiService } from '../../../student-services/services/student-services-api.service';
import { StudentServiceChatSocketService } from '../../../student-services/services/student-service-chat-socket.service';

@Component({
  standalone: false,
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html',
})
export class UserProfilePageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authApiService = inject(AuthApiService);
  private readonly profileImageUploadService = inject(
    ProfileImageUploadService,
  );
  private readonly signalApiService = inject(SignalApiService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);
  private readonly studentServicesApiService = inject(
    StudentServicesApiService,
  );
  private readonly studentServiceChatSocketService = inject(
    StudentServiceChatSocketService,
  );
  private readonly requestedSection =
    this.route.snapshot.queryParamMap.get('section');
  private readonly requestedRequestId =
    this.route.snapshot.queryParamMap.get('requestId');
  private activeChatMessageSubscription?: Subscription;
  private activeChatTypingSubscription?: Subscription;
  private chatPollingSubscription?: Subscription;
  private chatBootstrappedForUserId: string | null = null;
  private localTypingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private remoteTypingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly ShieldCheckIcon = ShieldCheck;
  readonly SparklesIcon = Sparkles;
  readonly UserRoundIcon = UserRound;
  readonly BookOpenIcon = BookOpen;
  readonly SettingsIcon = Settings2;
  readonly MessageCircleIcon = MessageCircleMore;
  readonly SaveIcon = Save;
  readonly SendIcon = Send;
  readonly BellIcon = Bell;
  readonly BellRingIcon = BellRing;
  readonly Clock3Icon = Clock3;
  readonly DatabaseZapIcon = DatabaseZap;
  readonly ImagePlusIcon = ImagePlus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;

  readonly user = computed(() => this.userService.currentUser());
  readonly sections = PROFILE_SECTIONS;
  readonly activityFeed = PROFILE_ACTIVITY_FEED;
  readonly activeSection = signal<ProfileSectionId>('profile');
  readonly saveMessage = signal<string | null>(null);
  readonly isSavingProfile = signal(false);
  readonly isUploadingProfileImage = signal(false);
  readonly isSavingSettings = signal(false);
  readonly isUpdatingPassword = signal(false);
  readonly isLoadingChat = signal(false);
  readonly isLoadingSignals = signal(false);
  readonly isSavingSignal = signal(false);
  readonly selectedProfileImageFile = signal<File | null>(null);
  readonly selectedProfileImageFileName = computed(
    () => this.selectedProfileImageFile()?.name ?? '',
  );
  readonly profileImagePreviewUrl = signal<string | null>(null);
  readonly effectiveProfileImageUrl = computed(
    () => this.profileImagePreviewUrl() || this.user()?.avatarUrl || '',
  );
  readonly chatImagePreviewUrl = signal<string | null>(null);
  readonly messageDraft = signal('');
  readonly messageEditDraft = signal('');
  readonly editingMessageId = signal<string | null>(null);
  readonly chatSearch = signal('');
  readonly conversations = signal<ChatConversation[]>([]);
  readonly selectedChatImageFile = signal<File | null>(null);
  readonly userSignals = signal<UserSignal[]>([]);
  readonly editingSignalId = signal<number | null>(null);
  readonly selectedSignalImageFile = signal<File | null>(null);
  readonly signalImagePreviewUrl = signal<string | null>(null);
  readonly selectedConversationId = signal<string | null>(null);
  readonly selectedSectionMeta = computed<ProfileSidebarSection | undefined>(
    () => this.sections.find((section) => section.id === this.activeSection()),
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
  readonly selectedConversation = computed(
    () =>
      this.conversations().find(
        (conversation) => conversation.id === this.selectedConversationId(),
      ) ?? null,
  );

  readonly serviceCategories = signal<ServiceCategory[]>([]);
  readonly myServices = signal<StudentService[]>([]);
  readonly providerRequests = signal<StudentServiceRequest[]>([]);
  readonly isLoadingServices = signal(false);
  readonly myServicesPage = signal(1);
  readonly providerRequestsPage = signal(1);
  readonly servicesPageSize = 4;
  readonly serviceCategoryLookup = computed(
    () => new Map(this.serviceCategories().map((c) => [c.id, c])),
  );
  readonly paginatedMyServices = computed(() => {
    const start = (this.myServicesPage() - 1) * this.servicesPageSize;
    return this.myServices().slice(start, start + this.servicesPageSize);
  });
  readonly paginatedProviderRequests = computed(() => {
    const start = (this.providerRequestsPage() - 1) * this.servicesPageSize;
    return this.providerRequests().slice(start, start + this.servicesPageSize);
  });
  readonly myServicesTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.myServices().length / this.servicesPageSize)),
  );
  readonly providerRequestsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.providerRequests().length / this.servicesPageSize)),
  );

  readonly profileForm = this.fb.nonNullable.group({
    email: [
      { disabled: true, value: '' },
      [Validators.required, Validators.email],
    ],
    imageUrl: [''],
    lastname: ['', Validators.required],
    username: ['', Validators.required],
  });

  readonly settingsForm = this.fb.nonNullable.group({
    twoFactorEnabled: [false],
  });

  readonly signalForm = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    confirmPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    oldPassword: ['', Validators.required],
  });

  constructor() {
    if (
      this.requestedSection === 'profile' ||
      this.requestedSection === 'settings' ||
      this.requestedSection === 'chat' ||
      this.requestedSection === 'services'
    ) {
      this.activeSection.set(this.requestedSection);
    }

    void this.loadProfile();
    void this.loadSignals();
    this.startChatPolling();

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

      if (this.chatBootstrappedForUserId !== profile.id) {
        this.chatBootstrappedForUserId = profile.id;
        queueMicrotask(() => {
          void this.loadStudentServiceConversations(true);
        });
      }

      if (this.activeSection() === 'services') {
        queueMicrotask(() => {
          void this.loadServicesAndRequests();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseProfileImagePreviewUrl();
    this.releaseSignalImagePreviewUrl();
    this.releaseChatImagePreviewUrl();
    this.stopRealtimeConversation();
    this.clearTypingTimeouts();
    this.chatPollingSubscription?.unsubscribe();
  }

  selectSection(sectionId: ProfileSectionId): void {
    this.activeSection.set(sectionId);
    this.saveMessage.set(null);

    if (sectionId === 'chat') {
      void this.loadStudentServiceConversations(true);
    }

    if (sectionId === 'services') {
      void this.loadServicesAndRequests();
    }
  }

  selectConversation(conversationId: string): void {
    this.focusConversation(conversationId);
    void this.loadConversationMessages(conversationId);
  }

  private focusConversation(conversationId: string): void {
    const previousConversationId = this.selectedConversationId();
    if (previousConversationId && previousConversationId !== conversationId) {
      this.emitTypingIndicatorForConversation(previousConversationId, false);
    }

    this.selectedConversationId.set(conversationId);
    this.activeSection.set('chat');
    this.saveMessage.set(null);
    this.startRealtimeForConversation(conversationId);
    this.conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
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
        this.userService.updateProfile({
          twoFactorEnabled: this.settingsForm.controls.twoFactorEnabled.value,
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

  saveSignal(): void {
    if (this.isSavingSignal()) {
      return;
    }

    this.signalForm.markAllAsTouched();
    if (this.signalForm.invalid) {
      return;
    }

    this.isSavingSignal.set(true);
    this.saveMessage.set(null);

    const description = this.signalForm.controls.description.value.trim();
    const image = this.selectedSignalImageFile();
    const signalId = this.editingSignalId();

    const action = signalId
      ? this.signalApiService.updateSignal(signalId, description, image)
      : this.signalApiService.createSignal(description, image);

    void action
      .then(async () => {
        await this.loadSignals();
        this.resetSignalComposer();
        this.saveMessage.set(
          signalId
            ? 'Signal updated successfully.'
            : 'Signal created successfully.',
        );
        this.toastService.success(
          signalId
            ? 'Signal updated successfully.'
            : 'Signal created successfully.',
          signalId ? 'Signal Updated' : 'Signal Sent',
        );
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to save your signal right now.',
        );
        this.saveMessage.set(message);
        this.toastService.error(message, 'Signal Failed');
      })
      .finally(() => {
        this.isSavingSignal.set(false);
      });
  }

  editSignal(signal: UserSignal): void {
    this.editingSignalId.set(signal.id);
    this.signalForm.controls.description.setValue(signal.description);
    this.clearSelectedSignalImage();
    this.signalImagePreviewUrl.set(signal.imageUrl);
    this.activeSection.set('signals');
    this.saveMessage.set('Editing your signal.');
  }

  deleteSignal(signalId: number): void {
    if (this.isSavingSignal()) {
      return;
    }

    this.isSavingSignal.set(true);
    void this.signalApiService
      .deleteSignal(signalId)
      .then(async () => {
        await this.loadSignals();
        if (this.editingSignalId() === signalId) {
          this.resetSignalComposer();
        }
        this.saveMessage.set('Signal deleted successfully.');
        this.toastService.success(
          'Signal deleted successfully.',
          'Signal Deleted',
        );
      })
      .catch((error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to delete this signal right now.',
        );
        this.saveMessage.set(message);
        this.toastService.error(message, 'Signal Delete Failed');
      })
      .finally(() => {
        this.isSavingSignal.set(false);
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
    const imageFile = this.selectedChatImageFile();

    if ((!content && !imageFile) || !conversationId) {
      return;
    }

    this.messageDraft.set('');
    this.clearSelectedChatImage();
    this.emitTypingIndicatorForConversation(conversationId, false);
    this.clearLocalTypingTimeout();

    const currentUser = this.user();

    if (imageFile) {
      this.studentServicesApiService
        .sendConversationImage(conversationId, imageFile, content)
        .subscribe({
          next: (message) => {
            this.applyRealtimeMessage(message);
            void this.loadStudentServiceConversations();
          },
          error: (error) => {
            const message = this.authApiService.extractErrorMessage(
              error,
              'Unable to send the image right now.',
            );
            this.toastService.error(message, 'Image Send Failed');
          },
        });
      return;
    }

    try {
      this.studentServiceChatSocketService.sendMessage({
        content,
        conversationId: Number(conversationId),
        senderId: Number(currentUser?.id ?? 0),
        senderName: `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim(),
      });
    } catch {
      this.studentServicesApiService
        .sendConversationMessage(conversationId, content)
        .subscribe({
          next: (message) => {
            this.applyRealtimeMessage(message);
            void this.loadStudentServiceConversations();
          },
          error: (error) => {
            const message = this.authApiService.extractErrorMessage(
              error,
              'Unable to send the message right now.',
            );
            this.toastService.error(message, 'Message Failed');
          },
        });
    }
  }

  onDraftChange(event: Event): void {
    this.messageDraft.set((event.target as HTMLInputElement).value);
    this.handleTypingDraftChange();
  }

  onChatImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toastService.error(
        'Please choose a valid image file.',
        'Invalid Image',
      );
      if (input) {
        input.value = '';
      }
      return;
    }

    this.releaseChatImagePreviewUrl();
    this.selectedChatImageFile.set(file);
    this.chatImagePreviewUrl.set(URL.createObjectURL(file));
  }

  clearSelectedChatImage(): void {
    this.selectedChatImageFile.set(null);
    this.releaseChatImagePreviewUrl();
  }

  startEditingMessage(message: ChatMessage): void {
    if (message.author !== 'me' || message.isDeleted) {
      return;
    }

    this.editingMessageId.set(message.id);
    this.messageEditDraft.set(message.content);
  }

  cancelEditingMessage(): void {
    this.editingMessageId.set(null);
    this.messageEditDraft.set('');
  }

  onMessageEditDraftChange(event: Event): void {
    this.messageEditDraft.set((event.target as HTMLInputElement).value);
  }

  saveEditedMessage(messageId: string): void {
    const content = this.messageEditDraft().trim();
    if (!content) {
      return;
    }

    this.studentServicesApiService.updateConversationMessage(messageId, content).subscribe({
      next: (message) => {
        this.applyRealtimeMessage(message);
        this.cancelEditingMessage();
      },
      error: (error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to edit the message right now.',
        );
        this.toastService.error(message, 'Edit Failed');
      },
    });
  }

  deleteMessage(messageId: string): void {
    this.studentServicesApiService.deleteConversationMessage(messageId).subscribe({
      next: (message) => {
        this.applyRealtimeMessage(message);
        if (this.editingMessageId() === messageId) {
          this.cancelEditingMessage();
        }
      },
      error: (error) => {
        const message = this.authApiService.extractErrorMessage(
          error,
          'Unable to remove the message right now.',
        );
        this.toastService.error(message, 'Delete Failed');
      },
    });
  }

  onChatSearchChange(event: Event): void {
    this.chatSearch.set((event.target as HTMLInputElement).value);
  }

  onMessageComposerBlur(): void {
    const conversationId = this.selectedConversationId();
    if (conversationId) {
      this.emitTypingIndicatorForConversation(conversationId, false);
    }
    this.clearLocalTypingTimeout();
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

  onSignalImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.saveMessage.set('Please choose a valid image file for the signal.');
      this.toastService.error(
        'Please choose a valid image file.',
        'Invalid Signal Image',
      );
      if (input) {
        input.value = '';
      }
      return;
    }

    this.releaseSignalImagePreviewUrl();
    this.selectedSignalImageFile.set(file);
    this.signalImagePreviewUrl.set(URL.createObjectURL(file));
  }

  clearSelectedSignalImage(): void {
    this.selectedSignalImageFile.set(null);
    this.releaseSignalImagePreviewUrl();
  }

  cancelSignalEdit(): void {
    this.resetSignalComposer();
  }

  getServiceCategory(service: StudentService): ServiceCategory | undefined {
    return this.serviceCategoryLookup().get(service.categoryId);
  }

  acceptProviderRequest(requestId: string): void {
    this.studentServicesApiService
      .updateRequestStatus(requestId, 'accepted')
      .subscribe((request) => {
        if (!request) {
          this.toastService.error('Unable to accept this request.', 'Update Failed');
          return;
        }
        this.toastService.success('Request accepted.', 'Request Accepted');
        void this.loadServicesAndRequests();
      });
  }

  declineProviderRequest(requestId: string): void {
    this.studentServicesApiService
      .updateRequestStatus(requestId, 'declined')
      .subscribe((request) => {
        if (!request) {
          this.toastService.error('Unable to decline this request.', 'Update Failed');
          return;
        }
        this.toastService.info('Request declined.', 'Request Updated');
        void this.loadServicesAndRequests();
      });
  }

  deleteMyService(serviceId: string): void {
    this.studentServicesApiService.deleteService(serviceId).subscribe((deleted) => {
      if (!deleted) {
        this.toastService.error('Unable to delete this post.', 'Delete Failed');
        return;
      }
      this.toastService.success('Service post deleted.', 'Post Removed');
      void this.loadServicesAndRequests();
    });
  }

  setMyServicesPage(page: number): void {
    if (page >= 1 && page <= this.myServicesTotalPages()) {
      this.myServicesPage.set(page);
    }
  }

  setProviderRequestsPage(page: number): void {
    if (page >= 1 && page <= this.providerRequestsTotalPages()) {
      this.providerRequestsPage.set(page);
    }
  }

  private startChatPolling(): void {
    this.chatPollingSubscription?.unsubscribe();
    this.chatPollingSubscription = interval(10000).subscribe(() => {
      if (
        !this.user() ||
        this.activeSection() !== 'chat' ||
        this.studentServiceChatSocketService.isConnected()
      ) {
        return;
      }

      void this.loadStudentServiceConversations();
      const selectedConversationId = this.selectedConversationId();
      if (selectedConversationId) {
        void this.loadConversationMessages(selectedConversationId, false);
      }
    });
  }

  private async loadStudentServiceConversations(
    forceFocus = false,
  ): Promise<void> {
    if (!this.user()) {
      return;
    }

    this.isLoadingChat.set(true);

    try {
      const conversations = await firstValueFrom(
        this.studentServicesApiService.getConversations(),
      );
      const currentUserId = this.user()?.id ?? '';
      const previousMessages = new Map(
        this.conversations().map((conversation) => [
          conversation.id,
          conversation.messages,
        ]),
      );

      const mappedConversations: ChatConversation[] = conversations.map(
        (conversation) => ({
          avatarUrl: createAvatarDataUrl(conversation.otherParticipantName),
          id: conversation.id,
          isTyping: false,
          lastMessage: conversation.lastMessage,
          lastMessageTime: this.formatTimestamp(conversation.lastMessageAt),
          lastSeen: conversation.active
            ? 'Conversation active'
            : 'Conversation unavailable',
          messages: previousMessages.get(conversation.id) ?? [],
          name: conversation.otherParticipantName,
          requestId: conversation.requestId,
          role: conversation.serviceTitle,
          serviceTitle: conversation.serviceTitle,
          status: conversation.active ? 'online' : 'offline',
          tags: ['Student service'],
          unreadCount: 0,
        }),
      );

      this.conversations.set(mappedConversations);

      const preferredConversationId =
        this.selectedConversationId() ??
        mappedConversations.find(
          (conversation) => conversation.requestId === this.requestedRequestId,
        )?.id ??
        mappedConversations[0]?.id ??
        null;

      if (
        preferredConversationId &&
        (forceFocus || !this.selectedConversationId())
      ) {
        this.focusConversation(preferredConversationId);
        await this.loadConversationMessages(preferredConversationId, false);
      } else if (this.requestedRequestId) {
        const requestedConversation = mappedConversations.find(
          (conversation) => conversation.requestId === this.requestedRequestId,
        );
        if (requestedConversation) {
          this.focusConversation(requestedConversation.id);
          await this.loadConversationMessages(requestedConversation.id, false);
        } else {
          const conversation = await firstValueFrom(
            this.studentServicesApiService.getConversationForRequest(
              this.requestedRequestId,
            ),
          );
          if (conversation) {
            await this.loadStudentServiceConversations(true);
          }
        }
      }

      if (!mappedConversations.length) {
        this.stopRealtimeConversation();
        this.selectedConversationId.set(null);
      }

      if (!currentUserId) {
        this.selectedConversationId.set(null);
      }
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to load your student-service conversations right now.',
      );
      this.toastService.error(message, 'Chat Load Failed');
    } finally {
      this.isLoadingChat.set(false);
    }
  }

  private async loadConversationMessages(
    conversationId: string,
    showErrors = true,
  ): Promise<void> {
    try {
      const currentUserId = this.user()?.id ?? '';
      const messages = await firstValueFrom(
        this.studentServicesApiService.getConversationMessages(conversationId),
      );

      this.conversations.update((conversations) =>
        conversations.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage:
              messages.at(-1) !== undefined
                ? this.buildConversationPreview(messages.at(-1)!)
                : conversation.lastMessage,
            lastMessageTime: this.formatTimestamp(
              messages.at(-1)?.sentAt ?? conversation.lastMessageTime,
            ),
            messages: this.mapChatMessages(messages, currentUserId),
          };
        }),
      );
    } catch (error) {
      if (!showErrors) {
        return;
      }

      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to load the conversation messages right now.',
      );
      this.toastService.error(message, 'Messages Load Failed');
    }
  }

  private mapChatMessages(
    messages: {
      id: string;
      senderId: string;
      content: string;
      imageUrl?: string | null;
      sentAt: string;
      editedAt?: string | null;
      deletedAt?: string | null;
    }[],
    currentUserId: string,
  ): ChatMessage[] {
    let previousDayLabel = '';

    return messages.map((message) => {
      const dayLabel = this.formatDayLabel(message.sentAt);
      const shouldShowDayLabel = dayLabel !== previousDayLabel;
      previousDayLabel = dayLabel;

      return {
        author: message.senderId === currentUserId ? 'me' : 'other',
        content: message.content,
        dayLabel: shouldShowDayLabel ? dayLabel : undefined,
        id: message.id,
        imageUrl: message.imageUrl ?? null,
        isDeleted: !!message.deletedAt,
        isEdited: !!message.editedAt,
        rawSentAt: message.sentAt,
        timestamp: this.formatTimestamp(message.sentAt),
      };
    });
  }

  private startRealtimeForConversation(conversationId: string): void {
    this.stopRealtimeConversation();

    this.activeChatMessageSubscription = this.studentServiceChatSocketService
      .watchConversationMessages(conversationId)
      .subscribe((message) => {
        this.applyRealtimeMessage(message);
      });

    this.activeChatTypingSubscription = this.studentServiceChatSocketService
      .watchConversationTyping(conversationId)
      .subscribe((indicator) => {
        this.applyTypingIndicator(indicator);
      });
  }

  private stopRealtimeConversation(): void {
    this.activeChatMessageSubscription?.unsubscribe();
    this.activeChatTypingSubscription?.unsubscribe();
    this.activeChatMessageSubscription = undefined;
    this.activeChatTypingSubscription = undefined;
  }

  private applyRealtimeMessage(message: StudentServiceChatMessage): void {
    const currentUserId = this.user()?.id ?? '';

    this.conversations.update((conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== message.conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          isTyping:
            message.senderId === currentUserId ? conversation.isTyping : false,
          lastMessage: this.buildConversationPreview(message),
          lastMessageTime: this.formatTimestamp(message.sentAt),
          messages: this.upsertRealtimeMessageInConversation(
            conversation.messages,
            message,
            currentUserId,
          ),
          unreadCount: 0,
        };
      }),
    );
  }

  private applyTypingIndicator(
    indicator: StudentServiceChatTypingIndicator,
  ): void {
    const currentUserId = this.user()?.id ?? '';
    if (
      indicator.senderId === currentUserId ||
      indicator.conversationId !== this.selectedConversationId()
    ) {
      return;
    }

    this.conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === indicator.conversationId
          ? { ...conversation, isTyping: indicator.typing }
          : conversation,
      ),
    );

    if (indicator.typing) {
      this.clearRemoteTypingTimeout();
      this.remoteTypingTimeoutId = setTimeout(() => {
        this.conversations.update((conversations) =>
          conversations.map((conversation) =>
            conversation.id === indicator.conversationId
              ? { ...conversation, isTyping: false }
              : conversation,
          ),
        );
      }, 2200);
    }
  }

  private upsertRealtimeMessageInConversation(
    messages: ChatMessage[],
    message: StudentServiceChatMessage,
    currentUserId: string,
  ): ChatMessage[] {
    const mappedMessage: ChatMessage = {
      author: message.senderId === currentUserId ? 'me' : 'other',
      content: message.content,
      id: message.id,
      imageUrl: message.imageUrl ?? null,
      isDeleted: !!message.deletedAt,
      isEdited: !!message.editedAt,
      rawSentAt: message.sentAt,
      timestamp: this.formatTimestamp(message.sentAt),
    };

    const existingIndex = messages.findIndex((item) => item.id === message.id);
    if (existingIndex >= 0) {
      const nextMessages = [...messages];
      nextMessages[existingIndex] = {
        ...nextMessages[existingIndex],
        ...mappedMessage,
      };
      return this.recomputeMessageDayLabels(nextMessages);
    }

    return this.recomputeMessageDayLabels([...messages, mappedMessage]);
  }

  private handleTypingDraftChange(): void {
    const conversationId = this.selectedConversationId();
    if (!conversationId) {
      return;
    }

    const hasDraft = this.messageDraft().trim().length > 0;
    this.emitTypingIndicatorForConversation(conversationId, hasDraft);
    this.clearLocalTypingTimeout();

    if (hasDraft) {
      this.localTypingTimeoutId = setTimeout(() => {
        this.emitTypingIndicatorForConversation(conversationId, false);
      }, 1400);
    }
  }

  private emitTypingIndicatorForConversation(
    conversationId: string,
    typing: boolean,
  ): void {
    const currentUser = this.user();
    if (!currentUser?.id) {
      return;
    }

    this.studentServiceChatSocketService.publishTyping({
      conversationId: Number(conversationId),
      senderId: Number(currentUser.id),
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      typing,
    });
  }

  private clearTypingTimeouts(): void {
    this.clearLocalTypingTimeout();
    this.clearRemoteTypingTimeout();
  }

  private clearLocalTypingTimeout(): void {
    if (this.localTypingTimeoutId) {
      clearTimeout(this.localTypingTimeoutId);
      this.localTypingTimeoutId = null;
    }
  }

  private clearRemoteTypingTimeout(): void {
    if (this.remoteTypingTimeoutId) {
      clearTimeout(this.remoteTypingTimeoutId);
      this.remoteTypingTimeoutId = null;
    }
  }

  private appendMessageToConversation(
    messages: ChatMessage[],
    content: string,
    author: 'me' | 'other',
    sentAt: string,
  ): ChatMessage[] {
    const dayLabel = this.formatDayLabel(sentAt);
    const lastDayLabel = this.formatDayLabelFromMessages(messages);

    return [
      ...messages,
      {
        author,
        content,
        dayLabel: lastDayLabel !== dayLabel ? dayLabel : undefined,
        id: `${Date.now()}`,
        timestamp: this.formatTimestamp(sentAt),
      },
    ];
  }

  private formatDayLabelFromMessages(messages: ChatMessage[]): string {
    const lastExplicitDay = [...messages]
      .reverse()
      .find((message) => message.dayLabel)?.dayLabel;
    return lastExplicitDay ?? '';
  }

  private formatDayLabel(value: string): string {
    const date = new Date(value);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString();
  }

  private formatTimestamp(value: string | null | undefined): string {
    if (!value) {
      return 'now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  private async loadSignals(): Promise<void> {
    this.isLoadingSignals.set(true);
    try {
      const signals = await this.signalApiService.getMySignals();
      this.userSignals.set(signals);
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to load your signals right now.',
      );
      this.saveMessage.set(message);
    } finally {
      this.isLoadingSignals.set(false);
    }
  }

  private async persistProfileChanges(): Promise<void> {
    try {
      const currentUser = this.user();
      const username = this.profileForm.controls.username.value.trim();
      const lastname = this.profileForm.controls.lastname.value.trim();
      let imageUrl = this.normalizeSubmittedImageUrl(
        this.profileForm.controls.imageUrl.value,
      );
      let didUploadProfileImage = false;

      if (this.selectedProfileImageFile()) {
        this.isUploadingProfileImage.set(true);
        this.saveMessage.set('Uploading your profile image...');
        imageUrl = await this.profileImageUploadService.uploadProfileImage(
          this.selectedProfileImageFile() as File,
        );
        this.profileForm.controls.imageUrl.setValue(imageUrl);
        didUploadProfileImage = true;
      }

      const hasProfileTextChanges =
        !currentUser ||
        username !== currentUser.firstName.trim() ||
        lastname !== currentUser.lastName.trim();
      const persistedImageUrl = didUploadProfileImage
        ? imageUrl
        : currentUser?.avatarUrl?.trim() || imageUrl;

      if (hasProfileTextChanges) {
        await this.userService.saveCurrentUserProfile({
          imageUrl: persistedImageUrl,
          lastname,
          username,
        });
      } else if (didUploadProfileImage) {
        await this.userService.loadCurrentUserProfile();
      }

      this.clearSelectedProfileImage();
      this.saveMessage.set('Profile updated successfully.');
      this.toastService.success(
        'Profile updated successfully.',
        'Profile Saved',
      );
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
    return this.isGeneratedAvatarDataUrl(normalizedValue)
      ? ''
      : normalizedValue;
  }

  private normalizeSubmittedImageUrl(value: string | null | undefined): string {
    const normalizedValue = value?.trim() ?? '';
    return this.isGeneratedAvatarDataUrl(normalizedValue)
      ? ''
      : normalizedValue;
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

  private releaseSignalImagePreviewUrl(): void {
    const previewUrl = this.signalImagePreviewUrl();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    this.signalImagePreviewUrl.set(null);
  }

  private releaseChatImagePreviewUrl(): void {
    const previewUrl = this.chatImagePreviewUrl();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    this.chatImagePreviewUrl.set(null);
  }

  private resetSignalComposer(): void {
    this.editingSignalId.set(null);
    this.signalForm.reset();
    this.clearSelectedSignalImage();
  }

  private async loadServicesAndRequests(): Promise<void> {
    if (!this.user()) {
      return;
    }

    this.isLoadingServices.set(true);

    try {
      const [categories, services, requests] = await Promise.all([
        firstValueFrom(this.studentServicesApiService.getCategories()),
        firstValueFrom(this.studentServicesApiService.getMyServices()),
        firstValueFrom(this.studentServicesApiService.getProviderRequests()),
      ]);

      this.serviceCategories.set(categories);
      this.myServices.set(services);
      this.providerRequests.set(requests);
      this.myServicesPage.set(1);
      this.providerRequestsPage.set(1);
    } catch (error) {
      const message = this.authApiService.extractErrorMessage(
        error,
        'Unable to load your services right now.',
      );
      this.toastService.error(message, 'Services Load Failed');
    } finally {
      this.isLoadingServices.set(false);
    }
  }

  private buildConversationPreview(
    message: Pick<
      StudentServiceChatMessage,
      'content' | 'imageUrl' | 'deletedAt'
    >,
  ): string {
    if (message.deletedAt) {
      return 'Message removed';
    }
    if (message.imageUrl?.trim()) {
      return message.content?.trim() ? message.content : 'Sent an image';
    }
    return message.content?.trim() || 'No messages yet.';
  }

  private recomputeMessageDayLabels(messages: ChatMessage[]): ChatMessage[] {
    let previousDayLabel = '';

    return messages.map((message) => {
      const dayLabel = this.formatDayLabel(message.rawSentAt ?? '');
      const shouldShowDayLabel = dayLabel !== previousDayLabel;
      previousDayLabel = dayLabel;

      return {
        ...message,
        dayLabel: shouldShowDayLabel ? dayLabel : undefined,
      };
    });
  }
}
