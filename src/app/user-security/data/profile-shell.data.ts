import { BellRing, BookOpen, LucideIconData, MessageCircleMore, Settings2, UserRound } from 'lucide-angular';
import { createAvatarDataUrl } from '../../shared/utils/avatar.util';
import { ChatConversation, ProfileActivity, ProfileSection } from '../models/profile-shell.model';
import { UserProfile } from '../models/user.model';

export interface ProfileSidebarSection extends ProfileSection {
  icon: LucideIconData;
}

export interface PreferenceCard {
  title: string;
  description: string;
  enabled: boolean;
}

export const PROFILE_SECTIONS: ProfileSidebarSection[] = [
  {
    description: 'Display and edit your public student identity.',
    icon: UserRound,
    id: 'profile',
    label: 'Profile'
  },
  {
    description: 'Manage notifications, privacy, and platform preferences.',
    icon: Settings2,
    id: 'settings',
    label: 'Settings'
  },
  {
    description: 'Keep your student conversations organized in one place.',
    icon: MessageCircleMore,
    id: 'chat',
    label: 'Chat'
  },
  {
    description: 'Create and manage your own alerts with optional screenshots.',
    icon: BellRing,
    id: 'signals',
    label: 'Signals'
  },
  {
    description: 'View and manage your service posts and incoming requests.',
    icon: BookOpen,
    id: 'services',
    label: 'Services'
  }
];

export const DEFAULT_PREFERENCES: PreferenceCard[] = [
  {
    title: 'Instant notifications',
    description: 'Receive alerts for new messages, rides, and roommate matches.',
    enabled: true
  },
  {
    title: 'Profile visibility',
    description: 'Let verified students discover your profile in searches.',
    enabled: true
  },
  {
    title: 'Security summary',
    description: 'Get a weekly digest about new devices and privacy changes.',
    enabled: false
  },
  {
    title: 'AI suggestions',
    description: 'Show personalized event and service recommendations on the platform.',
    enabled: true
  }
];





export const PROFILE_ACTIVITY_FEED: ProfileActivity[] = [
  {
    description: 'A landlord approved your visit request for Saturday afternoon.',
    id: 'activity-1',
    time: '5 min ago',
    title: 'Housing visit confirmed'
  },
  {
    description: 'Your ride request to Lac 1 received two new offers from verified students.',
    id: 'activity-2',
    time: '18 min ago',
    title: 'New carpool matches'
  },
  {
    description: 'Campus services marked your printing order as ready for pickup.',
    id: 'activity-3',
    time: '1 hour ago',
    title: 'Service update'
  },
  {
    description: 'Your profile reached the weekly visibility peak in roommate search results.',
    id: 'activity-4',
    time: 'Today',
    title: 'Profile boosted'
  }
];

export function createConversations(profile: UserProfile): ChatConversation[] {
  return [
    {
      avatarUrl: createAvatarDataUrl('Leila Ben Amor'),
      id: 'leila',
      lastMessage: 'I sent you the apartment photos and the rental details.',
      lastMessageTime: '2 min',
      lastSeen: 'online now',
      isTyping: true,
      messages: [
        {
          author: 'other',
          content: 'Hey! I found a coloc near campus with two free rooms.',
          id: 'leila-1',
          dayLabel: 'Today',
          timestamp: '09:18'
        },
        {
          author: 'me',
          content: 'Perfect, send me the details. I am interested in visiting this weekend.',
          id: 'leila-2',
          timestamp: '09:21'
        },
        {
          author: 'other',
          content: 'I sent you the apartment photos and the rental details.',
          id: 'leila-3',
          timestamp: '09:24'
        },
        {
          author: 'other',
          content: 'There is also a quiet study room and the owner accepts student contracts.',
          id: 'leila-4',
          timestamp: '09:26'
        }
      ],
      name: 'Leila Ben Amor',
      role: 'Housing match',
      status: 'online',
      tags: ['Housing', 'Visit'],
      unreadCount: 2
    },
    {
      avatarUrl: createAvatarDataUrl('Ahmed Trabelsi'),
      id: 'ahmed',
      lastMessage: 'Tomorrow 08:15 from campus gate sounds good.',
      lastMessageTime: '11 min',
      lastSeen: 'last seen 5 min ago',
      isTyping: false,
      messages: [
        {
          author: 'other',
          content: 'For the carpool tomorrow, does 08:15 from the main gate work for you?',
          id: 'ahmed-1',
          dayLabel: 'Today',
          timestamp: '08:02'
        },
        {
          author: 'me',
          content: 'Yes, that timing is perfect for me.',
          id: 'ahmed-2',
          timestamp: '08:04'
        },
        {
          author: 'other',
          content: 'Tomorrow 08:15 from campus gate sounds good.',
          id: 'ahmed-3',
          timestamp: '08:07'
        }
      ],
      name: 'Ahmed Trabelsi',
      role: 'Carpool partner',
      status: 'away',
      tags: ['Ride', 'Morning'],
      unreadCount: 0
    },
    {
      avatarUrl: createAvatarDataUrl('Campus Services Desk'),
      id: 'services',
      lastMessage: `Your printing request is ready, ${profile.firstName}.`,
      lastMessageTime: '1 h',
      lastSeen: 'active today',
      isTyping: false,
      messages: [
        {
          author: 'other',
          content: 'Your printing request is ready, you can collect it before 17:00.',
          id: 'services-1',
          dayLabel: 'Yesterday',
          timestamp: 'Yesterday'
        },
        {
          author: 'me',
          content: 'Great, I will stop by after my afternoon class.',
          id: 'services-2',
          timestamp: 'Yesterday'
        }
      ],
      name: 'Campus Services Desk',
      role: 'Student service',
      status: 'online',
      tags: ['Service', 'Printing'],
      unreadCount: 1
    },
    {
      avatarUrl: createAvatarDataUrl('Meriem Gharbi'),
      id: 'meriem',
      lastMessage: 'Can we swap the tutoring slot to 17:30 after the lab session?',
      lastMessageTime: '2 h',
      lastSeen: 'last seen 1 h ago',
      isTyping: false,
      messages: [
        {
          author: 'other',
          content: 'I prepared the tutoring notes for the algorithms session.',
          id: 'meriem-1',
          dayLabel: 'Today',
          timestamp: '12:40'
        },
        {
          author: 'me',
          content: 'Perfect, send them over when you can.',
          id: 'meriem-2',
          timestamp: '12:42'
        },
        {
          author: 'other',
          content: 'Can we swap the tutoring slot to 17:30 after the lab session?',
          id: 'meriem-3',
          timestamp: '12:46'
        }
      ],
      name: 'Meriem Gharbi',
      role: 'Tutoring partner',
      status: 'offline',
      tags: ['Tutoring', 'Algorithms'],
      unreadCount: 3
    },
    {
      avatarUrl: createAvatarDataUrl('Yassine Market'),
      id: 'market',
      lastMessage: 'Laptop still available, I can keep it for you until tomorrow morning.',
      lastMessageTime: '3 h',
      lastSeen: 'last seen 20 min ago',
      isTyping: false,
      messages: [
        {
          author: 'other',
          content: 'The laptop is still in excellent condition, battery health is 92%.',
          id: 'market-1',
          dayLabel: 'Today',
          timestamp: '11:10'
        },
        {
          author: 'me',
          content: 'Nice. Can you keep it until I finish classes?',
          id: 'market-2',
          timestamp: '11:12'
        },
        {
          author: 'other',
          content: 'Laptop still available, I can keep it for you until tomorrow morning.',
          id: 'market-3',
          timestamp: '11:15'
        }
      ],
      name: 'Yassine Market',
      role: 'Marketplace seller',
      status: 'away',
      tags: ['Marketplace', 'Laptop'],
      unreadCount: 1
    },
    {
      avatarUrl: createAvatarDataUrl('Esprit Event Club'),
      id: 'eventclub',
      lastMessage: `${profile.firstName}, your spot for the startup night panel is confirmed.`,
      lastMessageTime: 'Yesterday',
      lastSeen: 'active yesterday',
      isTyping: false,
      messages: [
        {
          author: 'other',
          content: 'We noticed you registered for Startup Night.',
          id: 'event-1',
          dayLabel: 'Yesterday',
          timestamp: 'Yesterday'
        },
        {
          author: 'other',
          content: `${profile.firstName}, your spot for the startup night panel is confirmed.`,
          id: 'event-2',
          timestamp: 'Yesterday'
        }
      ],
      name: 'Esprit Event Club',
      role: 'Event organizer',
      status: 'online',
      tags: ['Event', 'Startup'],
      unreadCount: 0
    }
  ];
}
