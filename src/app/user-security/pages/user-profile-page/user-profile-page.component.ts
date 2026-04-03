import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  Bell, BookOpen, Clock3, DatabaseZap, MessageCircleMore,
  Save, Send, Settings2, ShieldCheck, Sparkles, UserRound
} from 'lucide-angular';
import {
  createConversations,
  PROFILE_ACTIVITY_FEED,
  PROFILE_SECTIONS,
  PROFILE_SHORTCUTS,
  ProfileSidebarSection
} from '../../data/profile-shell.data';
import { ChatConversation, ProfileSectionId } from '../../models/profile-shell.model';
import { AuthApiService, UserProfile } from '../../services/auth-api.service';
import { ProfileImageUploadService } from '../../services/profile-image-upload.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

interface RoommateProfile {
  id: number;
  userId: any;
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
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfilePageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly authApiService = inject(AuthApiService);
  private readonly profileImageUploadService = inject(ProfileImageUploadService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);

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
  readonly Clock3Icon = Clock3;
  readonly DatabaseZapIcon = DatabaseZap;

  // Signals existants
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
  readonly profileImagePreviewUrl = signal<string | null>(null);
  readonly effectiveProfileImageUrl = computed(() =>
    this.profileImagePreviewUrl() || this.user()?.avatarUrl || ''
  );
  readonly selectedProfileImageFileName = computed(() => this.selectedProfileImageFile()?.name ?? '');
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

  // Nouveaux signaux pour le profil colocataire
  readonly roommateProfileId = signal<number | null>(null);
  readonly interestsArray = signal<string[]>([]);
  readonly isSavingRoommateProfile = signal(false);
  readonly roommateForm: FormGroup;

  // Forms existants
  readonly profileForm = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    imageUrl: [''],
    lastname: ['', Validators.required],
    username: ['', Validators.required],
  });
  readonly settingsForm = this.fb.nonNullable.group({ twoFactorEnabled: [false] });
  readonly passwordForm = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  constructor() {
    // Formulaire colocataire
    this.roommateForm = this.fb.group({
      age: [null, Validators.required],
      gender: ['', Validators.required],
      budget: [null, Validators.required],
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

    void this.loadProfile();
    this.loadFakeConversations();

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
      this.loadFakeConversations();
      // Charger le profil colocataire associé à cet utilisateur
      if (profile.id && typeof profile.id === 'number') {
        this.loadRoommateProfile(profile.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseProfileImagePreviewUrl();
  }

  // === Gestion profil colocataire ===
  private loadRoommateProfile(userId: number): void {
    this.http.get<RoommateProfile>(`http://localhost:8090/profiles/${userId}`).subscribe({
      next: (data) => {
        this.roommateProfileId.set(data.id);
        this.roommateForm.patchValue({
          age: data.age,
          gender: data.gender,
          budget: data.budget,
          city: data.city,
          sleepSchedule: data.sleepSchedule,
          studyLevel: data.studyLevel,
          smoker: data.smoker,
          pets: data.pets,
          cleanliness: data.cleanliness,
          socialLevel: data.socialLevel,
          acceptsGuests: data.acceptsGuests,
          noiseTolerance: data.noiseTolerance,
        });
        this.interestsArray.set(data.interests || []);
      },
      error: (err) => {
        console.error('Erreur chargement profil colocataire', err);
        this.toastService.error('Impossible de charger votre profil colocataire', 'Erreur');
      }
    });
  }

  saveRoommateProfile(): void {
    if (this.isSavingRoommateProfile()) return;
    this.roommateForm.markAllAsTouched();
    if (this.roommateForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires', 'Formulaire invalide');
      return;
    }

    this.isSavingRoommateProfile.set(true);
    const payload = {
      ...this.roommateForm.value,
      interests: this.interestsArray(),
      userId: this.user()?.id,
    };
    const profileId = this.roommateProfileId();
    const url = `http://localhost:8090/profiles/${profileId ?? this.user()?.id}`;
    const request = profileId
      ? this.http.put(url, payload)
      : this.http.post(url, payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Profil colocataire mis à jour', 'Succès');
        this.saveMessage.set('Profil colocataire enregistré');
        this.isSavingRoommateProfile.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Erreur lors de l\'enregistrement', 'Erreur');
        this.isSavingRoommateProfile.set(false);
      }
    });
  }

  cancelRoommateProfile(): void {
    const userId = this.user()?.id;
    if (userId && typeof userId === 'number') {
      this.loadRoommateProfile(userId);
    } else {
      this.roommateForm.reset({
        age: null,
        gender: '',
        budget: null,
        city: '',
        sleepSchedule: '',
        studyLevel: '',
        smoker: false,
        pets: false,
        cleanliness: 3,
        socialLevel: 3,
        acceptsGuests: false,
        noiseTolerance: 3,
      });
      this.interestsArray.set([]);
    }
    this.saveMessage.set(null);
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

  // === Méthodes existantes ===
  selectSection(sectionId: ProfileSectionId): void {
    this.activeSection.set(sectionId);
    this.saveMessage.set(null);
    if (sectionId === 'chat') {
      this.loadFakeConversations();
      if (!this.selectedConversationId()) this.selectedConversationId.set(this.conversations()[0]?.id ?? null);
    }
  }

  selectConversation(conversationId: string): void {
    this.focusConversation(conversationId);
  }

  private focusConversation(conversationId: string): void {
    this.selectedConversationId.set(conversationId);
    this.activeSection.set('chat');
    this.saveMessage.set(null);
    this.conversations.update(convs =>
      convs.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  }

  get passwordsMatch(): boolean {
    return this.passwordForm.controls.newPassword.value === this.passwordForm.controls.confirmPassword.value;
  }

  saveSettings(): void {
    if (this.isSavingSettings()) return;
    this.isSavingSettings.set(true);
    this.userService.setTwoFactorEnabled({ enabled: this.settingsForm.controls.twoFactorEnabled.value })
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
    if (this.passwordForm.invalid || !this.passwordsMatch) return;
    this.isUpdatingPassword.set(true);
    this.userService.updatePasswordRequest({
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

  sendMessage(): void {
    const content = this.messageDraft().trim();
    const convId = this.selectedConversationId();
    if (!content || !convId) return;
    this.conversations.update(convs =>
      convs.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c,
          lastMessage: content,
          lastMessageTime: 'now',
          messages: [...c.messages, { id: `${c.id}-${c.messages.length + 1}`, author: 'me', content, timestamp: 'now' }],
          unreadCount: 0,
        };
      })
    );
    this.messageDraft.set('');
    this.focusConversation(convId);
  }

  onDraftChange(event: Event): void {
    this.messageDraft.set((event.target as HTMLInputElement).value);
  }

  onChatSearchChange(event: Event): void {
    this.chatSearch.set((event.target as HTMLInputElement).value);
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

  private async loadProfile(): Promise<void> {
    try {
      await this.userService.loadCurrentUserProfile();
    } catch (error) {
      const msg = this.authApiService.extractErrorMessage(error, 'Impossible de charger le profil');
      this.toastService.error(msg, 'Erreur');
    }
  }

  private toEditableImageUrl(value: string | null | undefined): string {
    const v = value?.trim() ?? '';
    return v.startsWith('data:image/svg+xml') ? '' : v;
  }

  private isGeneratedAvatarDataUrl(value: string): boolean {
    return value.startsWith('data:image/svg+xml');
  }

  private releaseProfileImagePreviewUrl(): void {
    const url = this.profileImagePreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.profileImagePreviewUrl.set(null);
  }

  private loadFakeConversations(force = false): void {
    const profile = this.user();
    if (!profile) return;
    if (!force && this.conversations().length > 0) return;
    const seeded = createConversations(profile);
    this.conversations.set(seeded);
    if (!this.selectedConversationId() || force) this.selectedConversationId.set(seeded[0]?.id ?? null);
  }
}
