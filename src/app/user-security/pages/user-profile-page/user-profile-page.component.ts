import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Bell, BellRing, BookOpen, Clock3, DatabaseZap, ImagePlus,
  MessageCircleMore, Pencil, Save, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, UserRound
} from 'lucide-angular';
import { Subscription, firstValueFrom, interval } from 'rxjs';
import {
  createConversations,
  PROFILE_ACTIVITY_FEED,
  PROFILE_SECTIONS,
  PROFILE_SHORTCUTS,
  ProfileSidebarSection
} from '../../data/profile-shell.data';
import {
  ChatConversation,
  ChatMessage,
  ProfileSectionId,
  UserSignal
} from '../../models/profile-shell.model';
import { AuthApiService, UserProfile } from '../../services/auth-api.service';
import { ProfileImageUploadService } from '../../services/profile-image-upload.service';
import { SignalApiService } from '../../services/signal-api.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { createAvatarDataUrl } from '../../../shared/utils/avatar.util';
import { environment } from '../../../../environments/environment';
import {
  ServiceCategory,
  StudentService,
  StudentServiceChatMessage,
  StudentServiceChatTypingIndicator,
  StudentServiceRequest
} from '../../../student-services/models/student-service.model';
import { StudentServicesApiService } from '../../../student-services/services/student-services-api.service';
import { StudentServiceChatSocketService } from '../../../student-services/services/student-service-chat-socket.service';

export interface RoommateProfile {
  id: number;
  user: any;
  age: number;
  gender: string;
  budget: number;
  city: string;
  smoker: boolean;
  pets: boolean;
  cleanliness: number;
  sleepSchedule: string;
  studyLevel: string;
  socialLevel: number;
  acceptsGuests: boolean;
  noiseTolerance: number;
  interests: string[];
  latitude: number;
  longitude: number;
}

@Component({
  standalone: false,
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfilePageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly authApiService = inject(AuthApiService);
  private readonly profileImageUploadService = inject(ProfileImageUploadService);
  private readonly signalApiService = inject(SignalApiService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);
  private readonly studentServicesApiService = inject(StudentServicesApiService);
  private readonly studentServiceChatSocketService = inject(StudentServiceChatSocketService);

  private readonly requestedSection = this.route.snapshot.queryParamMap.get('section');
  private readonly requestedRequestId = this.route.snapshot.queryParamMap.get('requestId');
  private activeChatMessageSubscription?: Subscription;
  private activeChatTypingSubscription?: Subscription;
  private chatPollingSubscription?: Subscription;
  private chatBootstrappedForUserId: string | null = null;
  private localTypingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private remoteTypingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Icons
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
  readonly SearchIcon = Search;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;

  // State
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
  readonly isLoadingChat = signal(false);
  readonly isLoadingSignals = signal(false);
  readonly isSavingSignal = signal(false);
  readonly selectedProfileImageFile = signal<File | null>(null);
  readonly profileImagePreviewUrl = signal<string | null>(null);
  readonly effectiveProfileImageUrl = computed(
    () => this.profileImagePreviewUrl() || this.user()?.avatarUrl || ''
  );
  readonly selectedProfileImageFileName = computed(() => this.selectedProfileImageFile()?.name ?? '');

  // Chat state
  readonly chatImagePreviewUrl = signal<string | null>(null);
  readonly messageDraft = signal('');
  readonly messageEditDraft = signal('');
  readonly editingMessageId = signal<string | null>(null);
  readonly chatSearch = signal('');
  readonly conversations = signal<ChatConversation[]>([]);
  readonly selectedChatImageFile = signal<File | null>(null);
  readonly selectedConversationId = signal<string | null>(null);
  readonly selectedSectionMeta = computed<ProfileSidebarSection | undefined>(() =>
    this.sections.find(section => section.id === this.activeSection())
  );
  readonly sortedConversations = computed(() => {
    const selectedId = this.selectedConversationId();
    const query = this.chatSearch().trim().toLowerCase();
    return [...this.conversations().filter(c => !query ||
      c.name.toLowerCase().includes(query) ||
      c.role.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query) ||
      c.tags.some(tag => tag.toLowerCase().includes(query))
    )].sort((a, b) => {
      if (a.id === selectedId) return -1;
      if (b.id === selectedId) return 1;
      return b.unreadCount - a.unreadCount;
    });
  });
  readonly selectedConversation = computed(() =>
    this.conversations().find(c => c.id === this.selectedConversationId()) ?? null
  );

  // Signals state
  readonly userSignals = signal<UserSignal[]>([]);
  readonly editingSignalId = signal<number | null>(null);
  readonly selectedSignalImageFile = signal<File | null>(null);
  readonly signalImagePreviewUrl = signal<string | null>(null);

  // Services state
  readonly serviceCategories = signal<ServiceCategory[]>([]);
  readonly myServices = signal<StudentService[]>([]);
  readonly providerRequests = signal<StudentServiceRequest[]>([]);
  readonly isLoadingServices = signal(false);
  readonly myServicesPage = signal(1);
  readonly providerRequestsPage = signal(1);
  readonly servicesPageSize = 4;
  readonly serviceCategoryLookup = computed(
    () => new Map(this.serviceCategories().map(c => [c.id, c]))
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
    Math.max(1, Math.ceil(this.myServices().length / this.servicesPageSize))
  );
  readonly providerRequestsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.providerRequests().length / this.servicesPageSize))
  );

  // Roommate Profile state
  readonly roommateProfile = signal<RoommateProfile | null>(null);
  readonly isEditingProfile = signal(false);
  readonly roommateProfileId = signal<number | null>(null);
  readonly interestsArray = signal<string[]>([]);
  readonly isSavingRoommateProfile = signal(false);
  readonly roommateForm: FormGroup;

  // Forms
  readonly profileForm = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    imageUrl: [''],
    lastname: ['', Validators.required],
    username: ['', Validators.required],
  });
  readonly settingsForm = this.fb.nonNullable.group({ twoFactorEnabled: [false] });
  readonly signalForm = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(5)]],
  });
  readonly passwordForm = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  constructor() {
    this.roommateForm = this.fb.group({
      age: [null, [Validators.required, Validators.min(16)]],
      gender: ['', Validators.required],
      budget: [null, [Validators.required, Validators.min(0)]],
      city: ['', Validators.required],
      sleepSchedule: ['', Validators.required],
      studyLevel: ['', Validators.required],
      smoker: [false],
      pets: [false],
      cleanliness: [3],
      socialLevel: [3],
      acceptsGuests: [false],
      noiseTolerance: [3],
    });

    if (
      this.requestedSection === 'profile' ||
      this.requestedSection === 'settings' ||
      this.requestedSection === 'chat' ||
      this.requestedSection === 'signals' ||
      this.requestedSection === 'services'
    ) {
      this.activeSection.set(this.requestedSection);
    }

    void this.loadProfile();
    void this.loadSignals();
    this.startChatPolling();

    effect(() => {
      const profile = this.user();
      if (!profile) return;

      this.profileForm.patchValue({
        email: profile.email,
        imageUrl: this.toEditableImageUrl(profile.avatarUrl),
        lastname: profile.lastName,
        username: profile.firstName,
      });
      this.settingsForm.patchValue({ twoFactorEnabled: profile.twoFactorEnabled ?? false });

      if (this.chatBootstrappedForUserId !== profile.id) {
        this.chatBootstrappedForUserId = profile.id;
        queueMicrotask(() => { void this.loadStudentServiceConversations(true); });
      }

      if (profile.id) {
        this.loadRoommateProfile(Number(profile.id));
      }

      if (this.activeSection() === 'services') {
        queueMicrotask(() => { void this.loadServicesAndRequests(); });
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

  private jsonApiOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: environment.auth.withCredentials,
    };
  }

  // ── Section navigation ──────────────────────────────────────────────────────

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
    const previous = this.selectedConversationId();
    if (previous && previous !== conversationId) {
      this.emitTypingIndicatorForConversation(previous, false);
    }
    this.selectedConversationId.set(conversationId);
    this.activeSection.set('chat');
    this.saveMessage.set(null);
    this.startRealtimeForConversation(conversationId);
    this.conversations.update(convs =>
      convs.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  }

  get passwordsMatch(): boolean {
    return this.passwordForm.controls.newPassword.value === this.passwordForm.controls.confirmPassword.value;
  }

  // ── Profile ──────────────────────────────────────────────────────────────────

  saveProfile(): void {
    if (this.isSavingProfile()) return;
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;
    this.isSavingProfile.set(true);
    this.saveMessage.set(null);
    void this.persistProfileChanges();
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  saveSettings(): void {
    if (this.isSavingSettings()) return;
    this.isSavingSettings.set(true);
    this.saveMessage.set(null);
    void this.userService.setTwoFactorEnabled({ enabled: this.settingsForm.controls.twoFactorEnabled.value })
      .then(result => {
        this.toastService.success(result.message ?? '2FA mis à jour', 'Sécurité');
        this.saveMessage.set(result.message ?? '2FA mis à jour');
      })
      .catch(err => {
        const msg = this.authApiService.extractErrorMessage(err, 'Erreur 2FA');
        this.toastService.error(msg, 'Échec');
        this.saveMessage.set(msg);
      })
      .finally(() => this.isSavingSettings.set(false));
  }

  updatePassword(): void {
    if (this.isUpdatingPassword()) return;
    this.passwordForm.markAllAsTouched();
    this.saveMessage.set(null);
    if (this.passwordForm.invalid || !this.passwordsMatch) return;
    this.isUpdatingPassword.set(true);
    void this.userService.updatePasswordRequest({
      oldPassword: this.passwordForm.controls.oldPassword.value,
      newPassword: this.passwordForm.controls.newPassword.value,
    })
      .then(() => {
        this.passwordForm.reset();
        this.toastService.success('Mot de passe changé', 'Succès');
        this.saveMessage.set('Mot de passe mis à jour');
      })
      .catch(err => {
        const msg = this.authApiService.extractErrorMessage(err, 'Erreur mot de passe');
        this.toastService.error(msg, 'Échec');
        this.saveMessage.set(msg);
      })
      .finally(() => this.isUpdatingPassword.set(false));
  }

  // ── Signals ───────────────────────────────────────────────────────────────────

  saveSignal(): void {
    if (this.isSavingSignal()) return;
    this.signalForm.markAllAsTouched();
    if (this.signalForm.invalid) return;
    this.isSavingSignal.set(true);
    this.saveMessage.set(null);
    const description = this.signalForm.controls.description.value.trim();
    const image = this.selectedSignalImageFile();
    const signalId = this.editingSignalId();
    const action = signalId
      ? this.signalApiService.updateSignal(signalId, description, image)
      : this.signalApiService.createSignal(description, image);
    void action.then(async () => {
      await this.loadSignals();
      this.resetSignalComposer();
      const msg = signalId ? 'Signal mis à jour.' : 'Signal créé.';
      this.saveMessage.set(msg);
      this.toastService.success(msg, signalId ? 'Signal Updated' : 'Signal Sent');
    }).catch(err => {
      const msg = this.authApiService.extractErrorMessage(err, 'Impossible de sauvegarder le signal.');
      this.saveMessage.set(msg);
      this.toastService.error(msg, 'Signal Failed');
    }).finally(() => this.isSavingSignal.set(false));
  }

  editSignal(signal: UserSignal): void {
    this.editingSignalId.set(signal.id);
    this.signalForm.controls.description.setValue(signal.description);
    this.clearSelectedSignalImage();
    this.signalImagePreviewUrl.set(signal.imageUrl);
    this.activeSection.set('signals');
    this.saveMessage.set('Modification du signal...');
  }

  deleteSignal(signalId: number): void {
    if (this.isSavingSignal()) return;
    this.isSavingSignal.set(true);
    void this.signalApiService.deleteSignal(signalId).then(async () => {
      await this.loadSignals();
      if (this.editingSignalId() === signalId) this.resetSignalComposer();
      this.saveMessage.set('Signal supprimé.');
      this.toastService.success('Signal supprimé.', 'Signal Deleted');
    }).catch(err => {
      const msg = this.authApiService.extractErrorMessage(err, 'Impossible de supprimer le signal.');
      this.saveMessage.set(msg);
      this.toastService.error(msg, 'Signal Delete Failed');
    }).finally(() => this.isSavingSignal.set(false));
  }

  cancelSignalEdit(): void {
    this.resetSignalComposer();
  }

  onSignalImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Image invalide.', 'Invalid Signal Image');
      if (input) input.value = '';
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

  // ── Services ─────────────────────────────────────────────────────────────────

  getServiceCategory(service: StudentService): ServiceCategory | undefined {
    return this.serviceCategoryLookup().get(service.categoryId);
  }

  acceptProviderRequest(requestId: string): void {
    this.studentServicesApiService.updateRequestStatus(requestId, 'accepted').subscribe(request => {
      if (!request) { this.toastService.error('Impossible d\'accepter.', 'Update Failed'); return; }
      this.toastService.success('Demande acceptée.', 'Request Accepted');
      void this.loadServicesAndRequests();
    });
  }

  declineProviderRequest(requestId: string): void {
    this.studentServicesApiService.updateRequestStatus(requestId, 'declined').subscribe(request => {
      if (!request) { this.toastService.error('Impossible de refuser.', 'Update Failed'); return; }
      this.toastService.info('Demande refusée.', 'Request Updated');
      void this.loadServicesAndRequests();
    });
  }

  deleteMyService(serviceId: string): void {
    this.studentServicesApiService.deleteService(serviceId).subscribe(deleted => {
      if (!deleted) { this.toastService.error('Impossible de supprimer.', 'Delete Failed'); return; }
      this.toastService.success('Service supprimé.', 'Post Removed');
      void this.loadServicesAndRequests();
    });
  }

  setMyServicesPage(page: number): void {
    if (page >= 1 && page <= this.myServicesTotalPages()) this.myServicesPage.set(page);
  }

  setProviderRequestsPage(page: number): void {
    if (page >= 1 && page <= this.providerRequestsTotalPages()) this.providerRequestsPage.set(page);
  }

  // ── Roommate Profile ──────────────────────────────────────────────────────────

  private loadRoommateProfile(userId: number): void {
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    this.http.get<RoommateProfile>(`${base}/profiles/${userId}`, this.jsonApiOptions()).subscribe({
      next: (data) => {
        if (data) {
          this.roommateProfile.set(data);
          this.roommateProfileId.set(data.id);
          this.patchRoommateForm(data);
        }
      },
      error: (err) => {
        if (err.status !== 404) {
          this.toastService.error('Impossible de charger le profil colocataire', 'Erreur');
        }
      }
    });
  }

  private patchRoommateForm(data: RoommateProfile): void {
    this.roommateForm.patchValue({
      age: data.age, gender: data.gender, budget: data.budget, city: data.city,
      sleepSchedule: data.sleepSchedule, studyLevel: data.studyLevel,
      smoker: data.smoker, pets: data.pets, cleanliness: data.cleanliness,
      socialLevel: data.socialLevel, acceptsGuests: data.acceptsGuests,
      noiseTolerance: data.noiseTolerance,
    });
    this.interestsArray.set(data.interests || []);
  }

  saveRoommateProfile(): void {
    if (this.isSavingRoommateProfile()) return;
    this.roommateForm.markAllAsTouched();
    if (this.roommateForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires', 'Formulaire invalide');
      return;
    }
    this.isSavingRoommateProfile.set(true);
    const opts = this.jsonApiOptions();
    const profileId = this.roommateProfileId();
    const currentProfile = this.roommateProfile();
    const v = this.roommateForm.getRawValue();
    const payload = {
      id: profileId || 0, userId: this.user()?.id,
      age: Number(v.age), gender: v.gender, budget: Number(v.budget), city: v.city,
      smoker: !!v.smoker, pets: !!v.pets, cleanliness: Number(v.cleanliness),
      sleepSchedule: v.sleepSchedule, studyLevel: v.studyLevel,
      interests: this.interestsArray(), socialLevel: Number(v.socialLevel),
      acceptsGuests: !!v.acceptsGuests, noiseTolerance: Number(v.noiseTolerance),
      latitude: currentProfile?.latitude || 0, longitude: currentProfile?.longitude || 0,
    };
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    const userId = this.user()?.id;
    const request$ = profileId
      ? this.http.put<any>(`${base}/profiles/${userId}`, payload, opts)
      : this.http.post<any>(`${base}/profiles`, payload, opts);
    request$.subscribe({
      next: () => {
        if (userId) this.loadRoommateProfile(Number(userId));
        this.isEditingProfile.set(false);
        this.toastService.success('Profil colocataire enregistré avec succès');
        this.saveMessage.set('Profil colocataire enregistré');
        this.isSavingRoommateProfile.set(false);
      },
      error: (err: any) => {
        this.isSavingRoommateProfile.set(false);
        this.toastService.error('Erreur lors de l\'enregistrement', 'Erreur');
      }
    });
  }

  cancelRoommateProfile(): void {
    this.isEditingProfile.set(false);
    this.saveMessage.set(null);
    const currentData = this.roommateProfile();
    if (currentData) {
      this.patchRoommateForm(currentData);
    } else {
      this.roommateForm.reset({ cleanliness: 3, socialLevel: 3, noiseTolerance: 3 });
      this.interestsArray.set([]);
    }
  }

  addInterest(interest: string): void {
    const trimmed = interest.trim();
    if (trimmed && !this.interestsArray().includes(trimmed)) {
      this.interestsArray.update(arr => [...arr, trimmed]);
    }
  }

  removeInterest(index: number): void {
    this.interestsArray.update(arr => arr.filter((_, i) => i !== index));
  }

  // ── Chat / Messaging ──────────────────────────────────────────────────────────

  sendMessage(): void {
    const content = this.messageDraft().trim();
    const conversationId = this.selectedConversationId();
    const imageFile = this.selectedChatImageFile();
    if ((!content && !imageFile) || !conversationId) return;
    this.messageDraft.set('');
    this.clearSelectedChatImage();
    this.emitTypingIndicatorForConversation(conversationId, false);
    this.clearLocalTypingTimeout();
    const currentUser = this.user();
    if (imageFile) {
      this.studentServicesApiService.sendConversationImage(conversationId, imageFile, content).subscribe({
        next: (message) => { this.applyRealtimeMessage(message); void this.loadStudentServiceConversations(); },
        error: (err) => this.toastService.error(this.authApiService.extractErrorMessage(err, 'Erreur envoi image.'), 'Image Send Failed'),
      });
      return;
    }
    try {
      this.studentServiceChatSocketService.sendMessage({
        content, conversationId: Number(conversationId),
        senderId: Number(currentUser?.id ?? 0),
        senderName: `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim(),
      });
    } catch {
      this.studentServicesApiService.sendConversationMessage(conversationId, content).subscribe({
        next: (message) => { this.applyRealtimeMessage(message); void this.loadStudentServiceConversations(); },
        error: (err) => this.toastService.error(this.authApiService.extractErrorMessage(err, 'Erreur envoi message.'), 'Message Failed'),
      });
    }
  }

  onDraftChange(event: Event): void {
    this.messageDraft.set((event.target as HTMLInputElement).value);
    this.handleTypingDraftChange();
  }

  onChatSearchChange(event: Event): void {
    this.chatSearch.set((event.target as HTMLInputElement).value);
  }

  onChatImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Image invalide.', 'Invalid Image');
      if (input) input.value = '';
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
    if (message.author !== 'me' || message.isDeleted) return;
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
    if (!content) return;
    this.studentServicesApiService.updateConversationMessage(messageId, content).subscribe({
      next: (message) => { this.applyRealtimeMessage(message); this.cancelEditingMessage(); },
      error: (err) => this.toastService.error(this.authApiService.extractErrorMessage(err, 'Impossible de modifier.'), 'Edit Failed'),
    });
  }

  deleteMessage(messageId: string): void {
    this.studentServicesApiService.deleteConversationMessage(messageId).subscribe({
      next: (message) => { this.applyRealtimeMessage(message); if (this.editingMessageId() === messageId) this.cancelEditingMessage(); },
      error: (err) => this.toastService.error(this.authApiService.extractErrorMessage(err, 'Impossible de supprimer.'), 'Delete Failed'),
    });
  }

  onMessageComposerBlur(): void {
    const conversationId = this.selectedConversationId();
    if (conversationId) this.emitTypingIndicatorForConversation(conversationId, false);
    this.clearLocalTypingTimeout();
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Format image invalide', 'Erreur');
      input.value = '';
      return;
    }
    this.releaseProfileImagePreviewUrl();
    this.selectedProfileImageFile.set(file);
    this.profileImagePreviewUrl.set(URL.createObjectURL(file));
  }

  clearSelectedProfileImage(resetInput = false): void {
    this.selectedProfileImageFile.set(null);
    this.releaseProfileImagePreviewUrl();
    if (resetInput) {
      this.profileForm.controls.imageUrl.setValue(this.toEditableImageUrl(this.user()?.avatarUrl));
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────────

  private startChatPolling(): void {
    this.chatPollingSubscription?.unsubscribe();
    this.chatPollingSubscription = interval(10000).subscribe(() => {
      if (!this.user() || this.activeSection() !== 'chat' || this.studentServiceChatSocketService.isConnected()) return;
      void this.loadStudentServiceConversations();
      const selectedId = this.selectedConversationId();
      if (selectedId) void this.loadConversationMessages(selectedId, false);
    });
  }

  private async loadStudentServiceConversations(forceFocus = false): Promise<void> {
    if (!this.user()) return;
    this.isLoadingChat.set(true);
    try {
      const conversations = await firstValueFrom(this.studentServicesApiService.getConversations());
      const currentUserId = this.user()?.id ?? '';
      const previousMessages = new Map(this.conversations().map(c => [c.id, c.messages]));
      const mappedConversations: ChatConversation[] = conversations.map(conversation => ({
        avatarUrl: createAvatarDataUrl(conversation.otherParticipantName),
        id: String(conversation.id), isTyping: false,
        lastMessage: conversation.lastMessage,
        lastMessageTime: this.formatTimestamp(conversation.lastMessageAt),
        lastSeen: conversation.active ? 'active' : 'unavailable',
        messages: previousMessages.get(String(conversation.id)) ?? [],
        name: conversation.otherParticipantName, requestId: String(conversation.requestId),
        role: conversation.serviceTitle, serviceTitle: conversation.serviceTitle,
        status: conversation.active ? 'online' : 'offline',
        tags: ['Student service'], unreadCount: 0,
      }));
      this.conversations.set(mappedConversations);
      const preferredId = this.selectedConversationId() ??
        mappedConversations.find(c => c.requestId === this.requestedRequestId)?.id ??
        mappedConversations[0]?.id ?? null;
      if (preferredId && (forceFocus || !this.selectedConversationId())) {
        this.focusConversation(preferredId);
        await this.loadConversationMessages(preferredId, false);
      }
      if (!mappedConversations.length) { this.stopRealtimeConversation(); this.selectedConversationId.set(null); }
      if (!currentUserId) this.selectedConversationId.set(null);
    } catch (error) {
      const msg = this.authApiService.extractErrorMessage(error, 'Impossible de charger les conversations.');
      this.toastService.error(msg, 'Chat Load Failed');
    } finally {
      this.isLoadingChat.set(false);
    }
  }

  private async loadConversationMessages(conversationId: string, showErrors = true): Promise<void> {
    try {
      const currentUserId = this.user()?.id ?? '';
      const messages = await firstValueFrom(this.studentServicesApiService.getConversationMessages(conversationId));
      this.conversations.update(convs => convs.map(c => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          lastMessage: messages.at(-1) ? this.buildConversationPreview(messages.at(-1)!) : c.lastMessage,
          lastMessageTime: this.formatTimestamp(messages.at(-1)?.sentAt ?? c.lastMessageTime),
          messages: this.mapChatMessages(messages, currentUserId),
        };
      }));
    } catch (error) {
      if (!showErrors) return;
      this.toastService.error(this.authApiService.extractErrorMessage(error, 'Impossible de charger les messages.'), 'Messages Load Failed');
    }
  }

  private mapChatMessages(messages: { id: string; senderId: string; content: string; imageUrl?: string | null; sentAt: string; editedAt?: string | null; deletedAt?: string | null; }[], currentUserId: string): ChatMessage[] {
    let previousDayLabel = '';
    return messages.map(message => {
      const dayLabel = this.formatDayLabel(message.sentAt);
      const shouldShowDayLabel = dayLabel !== previousDayLabel;
      previousDayLabel = dayLabel;
      return {
        author: String(message.senderId) === String(currentUserId) ? 'me' : 'other',
        content: message.content, dayLabel: shouldShowDayLabel ? dayLabel : undefined,
        id: String(message.id), imageUrl: message.imageUrl ?? null,
        isDeleted: !!message.deletedAt, isEdited: !!message.editedAt,
        rawSentAt: message.sentAt, timestamp: this.formatTimestamp(message.sentAt),
      };
    });
  }

  private startRealtimeForConversation(conversationId: string): void {
    this.stopRealtimeConversation();
    if (!this.studentServiceChatSocketService.isConnected()) {
      this.studentServiceChatSocketService.resetBindings();
    }
    this.activeChatMessageSubscription = this.studentServiceChatSocketService.watchConversationMessages(conversationId).subscribe(message => this.applyRealtimeMessage(message));
    this.activeChatTypingSubscription = this.studentServiceChatSocketService.watchConversationTyping(conversationId).subscribe(indicator => this.applyTypingIndicator(indicator));
  }

  private stopRealtimeConversation(): void {
    this.activeChatMessageSubscription?.unsubscribe();
    this.activeChatTypingSubscription?.unsubscribe();
    this.activeChatMessageSubscription = undefined;
    this.activeChatTypingSubscription = undefined;
  }

  private applyRealtimeMessage(message: StudentServiceChatMessage): void {
    const currentUserId = String(this.user()?.id ?? '');
    const conversationId = String(message.conversationId);
    const senderId = String(message.senderId);
    this.conversations.update(convs => convs.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        isTyping: senderId === currentUserId ? c.isTyping : false,
        lastMessage: this.buildConversationPreview(message),
        lastMessageTime: this.formatTimestamp(message.sentAt),
        messages: this.upsertRealtimeMessageInConversation(c.messages, message, currentUserId),
        unreadCount: 0,
      };
    }));
  }

  private applyTypingIndicator(indicator: StudentServiceChatTypingIndicator): void {
    const currentUserId = String(this.user()?.id ?? '');
    const conversationId = String(indicator.conversationId);
    const senderId = String(indicator.senderId);
    if (senderId === currentUserId || conversationId !== this.selectedConversationId()) return;
    this.conversations.update(convs => convs.map(c => c.id === conversationId ? { ...c, isTyping: indicator.typing } : c));
    if (indicator.typing) {
      this.clearRemoteTypingTimeout();
      this.remoteTypingTimeoutId = setTimeout(() => {
        this.conversations.update(convs => convs.map(c => c.id === indicator.conversationId ? { ...c, isTyping: false } : c));
      }, 2200);
    }
  }

  private upsertRealtimeMessageInConversation(messages: ChatMessage[], message: StudentServiceChatMessage, currentUserId: string): ChatMessage[] {
    const msgId = String(message.id);
    const mapped: ChatMessage = {
      author: String(message.senderId) === currentUserId ? 'me' : 'other',
      content: message.content, id: msgId, imageUrl: message.imageUrl ?? null,
      isDeleted: !!message.deletedAt, isEdited: !!message.editedAt,
      rawSentAt: message.sentAt, timestamp: this.formatTimestamp(message.sentAt),
    };
    const idx = messages.findIndex(m => String(m.id) === msgId);
    if (idx >= 0) {
      const next = [...messages];
      next[idx] = { ...next[idx], ...mapped };
      return this.recomputeMessageDayLabels(next);
    }
    return this.recomputeMessageDayLabels([...messages, mapped]);
  }

  private handleTypingDraftChange(): void {
    const conversationId = this.selectedConversationId();
    if (!conversationId) return;
    const hasDraft = this.messageDraft().trim().length > 0;
    this.emitTypingIndicatorForConversation(conversationId, hasDraft);
    this.clearLocalTypingTimeout();
    if (hasDraft) {
      this.localTypingTimeoutId = setTimeout(() => this.emitTypingIndicatorForConversation(conversationId, false), 1400);
    }
  }

  private emitTypingIndicatorForConversation(conversationId: string, typing: boolean): void {
    const currentUser = this.user();
    if (!currentUser?.id) return;
    this.studentServiceChatSocketService.publishTyping({
      conversationId: Number(conversationId), senderId: Number(currentUser.id),
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(), typing,
    });
  }

  private clearTypingTimeouts(): void {
    this.clearLocalTypingTimeout();
    this.clearRemoteTypingTimeout();
  }

  private clearLocalTypingTimeout(): void {
    if (this.localTypingTimeoutId) { clearTimeout(this.localTypingTimeoutId); this.localTypingTimeoutId = null; }
  }

  private clearRemoteTypingTimeout(): void {
    if (this.remoteTypingTimeoutId) { clearTimeout(this.remoteTypingTimeoutId); this.remoteTypingTimeoutId = null; }
  }

  private async loadProfile(): Promise<void> {
    try {
      await this.userService.loadCurrentUserProfile();
    } catch (error) {
      const msg = this.authApiService.extractErrorMessage(error, 'Impossible de charger le profil');
      this.toastService.error(msg, 'Erreur');
    }
  }

  private async loadSignals(): Promise<void> {
    this.isLoadingSignals.set(true);
    try {
      const signals = await this.signalApiService.getMySignals();
      this.userSignals.set(signals);
    } catch (error) {
      const msg = this.authApiService.extractErrorMessage(error, 'Impossible de charger les signaux.');
      this.saveMessage.set(msg);
    } finally {
      this.isLoadingSignals.set(false);
    }
  }

  private async loadServicesAndRequests(): Promise<void> {
    if (!this.user()) return;
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
      this.toastService.error(this.authApiService.extractErrorMessage(error, 'Impossible de charger les services.'), 'Services Load Failed');
    } finally {
      this.isLoadingServices.set(false);
    }
  }

  private async persistProfileChanges(): Promise<void> {
    try {
      const currentUser = this.user();
      const username = this.profileForm.controls.username.value.trim();
      const lastname = this.profileForm.controls.lastname.value.trim();
      let imageUrl = this.toEditableImageUrl(this.profileForm.controls.imageUrl.value);
      let didUpload = false;
      if (this.selectedProfileImageFile()) {
        this.isUploadingProfileImage.set(true);
        imageUrl = await this.profileImageUploadService.uploadProfileImage(this.selectedProfileImageFile() as File);
        this.profileForm.controls.imageUrl.setValue(imageUrl);
        didUpload = true;
      }
      const hasTextChanges = !currentUser || username !== currentUser.firstName.trim() || lastname !== currentUser.lastName.trim();
      if (hasTextChanges) {
        await this.userService.saveCurrentUserProfile({ imageUrl: didUpload ? imageUrl : (currentUser?.avatarUrl?.trim() || imageUrl), lastname, username });
      } else if (didUpload) {
        await this.userService.loadCurrentUserProfile();
      }
      this.clearSelectedProfileImage();
      this.saveMessage.set('Profil mis à jour avec succès.');
      this.toastService.success('Profil mis à jour avec succès.', 'Profile Saved');
    } catch (error) {
      const msg = this.authApiService.extractErrorMessage(error, 'Impossible de mettre à jour le profil.');
      this.saveMessage.set(msg);
      this.toastService.error(msg, 'Profile Update Failed');
    } finally {
      this.isUploadingProfileImage.set(false);
      this.isSavingProfile.set(false);
    }
  }

  private buildConversationPreview(message: Pick<StudentServiceChatMessage, 'content' | 'imageUrl' | 'deletedAt'>): string {
    if (message.deletedAt) return 'Message removed';
    if (message.imageUrl?.trim()) return message.content?.trim() ? message.content : 'Sent an image';
    return message.content?.trim() || 'No messages yet.';
  }

  private recomputeMessageDayLabels(messages: ChatMessage[]): ChatMessage[] {
    let prev = '';
    return messages.map(m => {
      const dayLabel = this.formatDayLabel(m.rawSentAt ?? '');
      const show = dayLabel !== prev;
      prev = dayLabel;
      return { ...m, dayLabel: show ? dayLabel : undefined };
    });
  }

  private toEditableImageUrl(value: string | null | undefined): string {
    const v = value?.trim() ?? '';
    return v.startsWith('data:image/svg+xml') ? '' : v;
  }

  private releaseProfileImagePreviewUrl(): void {
    const url = this.profileImagePreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.profileImagePreviewUrl.set(null);
  }

  private releaseSignalImagePreviewUrl(): void {
    const url = this.signalImagePreviewUrl();
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    this.signalImagePreviewUrl.set(null);
  }

  private releaseChatImagePreviewUrl(): void {
    const url = this.chatImagePreviewUrl();
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    this.chatImagePreviewUrl.set(null);
  }

  private resetSignalComposer(): void {
    this.editingSignalId.set(null);
    this.signalForm.reset();
    this.clearSelectedSignalImage();
  }

  private formatDayLabel(value: string): string {
    const date = new Date(value);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  }

  private formatTimestamp(value: string | null | undefined): string {
    if (!value) return 'now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
