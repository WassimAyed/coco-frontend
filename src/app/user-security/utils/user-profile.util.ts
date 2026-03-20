import { AuthSession } from '../models/user.model';
import { createAvatarDataUrl } from '../../shared/utils/avatar.util';

const DEPARTMENTS = ['Software Engineering', 'Data Science', 'Business Computing', 'Networks & Security'];
const LEVELS = ['2nd year', '3rd year', '4th year', '5th year'];
const HIGHLIGHTS = [
  'Verified ESPRIT member',
  'Ready for secure student-only deals',
  'Eligible for rides, housing, and events'
];

function toTitleCase(value: string): string {
  return value
    .split(/[^a-zA-Z]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function hashValue(value: string): number {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
}

function formatNames(email: string): { firstName: string; lastName: string } {
  const [localPart] = email.split('@');
  const segments = localPart.split(/[._-]/).filter(Boolean);
  const firstName = toTitleCase(segments[0] ?? 'Esprit');
  const lastName = toTitleCase(segments.slice(1).join(' ')) || 'Student';

  return { firstName, lastName };
}

export function buildAuthSession(email: string, rememberMe: boolean): AuthSession {
  const normalizedEmail = email.trim().toLowerCase();
  const seed = hashValue(normalizedEmail);
  const department = DEPARTMENTS[seed % DEPARTMENTS.length];
  const academicLevel = LEVELS[seed % LEVELS.length];
  const { firstName, lastName } = formatNames(normalizedEmail);

  return {
    authenticatedAt: new Date().toISOString(),
    rememberMe,
    user: {
      academicLevel,
      avatarUrl: createAvatarDataUrl(`${firstName} ${lastName}`),
      bio: `Focused on collaborative campus life, ${department.toLowerCase()}, and making daily student routines smoother through trusted connections.`,
      campus: 'ESPRIT Ariana',
      department,
      email: normalizedEmail,
      firstName,
      highlights: HIGHLIGHTS,
      id: `student-${seed}`,
      lastName,
      role: 'student',
      stats: [
        {
          label: 'Rides shared',
          value: `${8 + (seed % 12)}`
        },
        {
          label: 'Trusted matches',
          value: `${12 + (seed % 18)}`
        },
        {
          label: 'Campus events',
          value: `${4 + (seed % 7)}`
        },
        {
          label: 'Saved deals',
          value: `${5 + (seed % 9)}`
        },
        {
          label: 'Open chats',
          value: `${6 + (seed % 5)}`
        },
        {
          label: 'Service requests',
          value: `${2 + (seed % 4)}`
        }
      ]
    }
  };
}
