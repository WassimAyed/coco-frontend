import { Component, computed, effect, inject, signal } from '@angular/core';
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
  DEFAULT_PREFERENCES,
  PROFILE_ACTIVITY_FEED,
  PROFILE_SECTIONS,
  PROFILE_SHORTCUTS,
  ProfileSidebarSection
} from '../../data/profile-shell.data';
import { ChatConversation, ProfileSectionId } from '../../models/profile-shell.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html'
})
export class UserProfilePageComponent {
  private readonly fb = inject(FormBuilder);
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
  readonly preferences = signal(DEFAULT_PREFERENCES);
  readonly messageDraft = signal('');
  readonly chatSearch = signal('');
  readonly conversations = signal<ChatConversation[]>([]);
  readonly selectedConversationId = signal<string | null>(null);
  readonly unreadConversationCount = computed(() =>
    this.conversations().reduce((total, conversation) => total + conversation.unreadCount, 0)
  );
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
    academicLevel: ['', Validators.required],
    bio: ['', [Validators.required, Validators.maxLength(240)]],
    campus: ['', Validators.required],
    department: ['', Validators.required],
    email: [{ disabled: true, value: '' }, [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required]
  });

  readonly settingsForm = this.fb.nonNullable.group({
    aiSuggestions: [DEFAULT_PREFERENCES[3].enabled],
    instantNotifications: [DEFAULT_PREFERENCES[0].enabled],
    profileVisibility: [DEFAULT_PREFERENCES[1].enabled],
    securitySummary: [DEFAULT_PREFERENCES[2].enabled]
  });

  constructor() {
    this.loadFakeConversations();

    effect(() => {
      const profile = this.user();

      if (!profile) {
        return;
      }

      this.profileForm.patchValue({
        academicLevel: profile.academicLevel,
        bio: profile.bio,
        campus: profile.campus,
        department: profile.department,
        email: profile.email,
        phone: profile.phone,
        firstName: profile.firstName,
        lastName: profile.lastName
      });

      this.loadFakeConversations();
    });
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

  saveProfile(): void {
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      return;
    }

    this.userService.updateProfile(this.profileForm.getRawValue());
    this.saveMessage.set('Profile updated successfully.');
  }

  saveSettings(): void {
    const values = this.settingsForm.getRawValue();

    this.preferences.set([
      {
        ...DEFAULT_PREFERENCES[0],
        enabled: values.instantNotifications
      },
      {
        ...DEFAULT_PREFERENCES[1],
        enabled: values.profileVisibility
      },
      {
        ...DEFAULT_PREFERENCES[2],
        enabled: values.securitySummary
      },
      {
        ...DEFAULT_PREFERENCES[3],
        enabled: values.aiSuggestions
      }
    ]);

    this.saveMessage.set('Settings saved for your account.');
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
}
