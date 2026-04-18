export type ProfileSectionId = 'profile' | 'settings' | 'chat' | 'signals' | 'services';

export interface ProfileSection {
  id: ProfileSectionId;
  label: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  author: 'me' | 'other';
  content: string;
  imageUrl?: string | null;
  isDeleted?: boolean;
  isEdited?: boolean;
  rawSentAt?: string;
  timestamp: string;
  dayLabel?: string;
}

export interface ChatConversation {
  id: string;
  requestId?: string;
  serviceTitle?: string;
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



export interface ProfileActivity {
  id: string;
  title: string;
  description: string;
  time: string;
}

export interface UserSignal {
  id: number;
  description: string;
  imageUrl: string | null;
  userId: number;
  username: string;
  createdAt: string | null;
}
