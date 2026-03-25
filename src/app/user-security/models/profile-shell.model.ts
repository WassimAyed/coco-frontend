export type ProfileSectionId = 'profile' | 'settings' | 'chat';

export interface ProfileSection {
  id: ProfileSectionId;
  label: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  author: 'me' | 'other';
  content: string;
  timestamp: string;
  dayLabel?: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTyping: boolean;
  tags: string[];
  messages: ChatMessage[];
}

export interface ProfileShortcut {
  title: string;
  value: string;
  caption: string;
}

export interface ProfileActivity {
  id: string;
  title: string;
  description: string;
  time: string;
}
