import { AuthSession, UserProfile, UserStat } from '../models/user.model';
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

function resolveUserRole(email: string): UserProfile['role'] {
  const [localPart] = email.split('@');
  return localPart.includes('admin') ? 'admin' : 'student';
}

function normalizeRole(value: unknown, email: string): UserProfile['role'] {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'student' || normalized === 'user') return 'student';
  }
  return resolveUserRole(email);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function decodeJwtPayload(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const decoded = typeof atob === 'function' ? atob(normalized) : '';
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(record: Record<string, unknown> | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function readBoolean(record: Record<string, unknown> | null, keys: string[]): boolean | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }
  return null;
}

// ✅ Fixed: only return string or number (no {} allowed)
function readValue(record: Record<string, unknown> | null, keys: string[]): string | number | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') return value;
  }
  return null;
}

function buildDefaultStats(seed: number, role: UserProfile['role']): UserStat[] {
  const isAdmin = role === 'admin';
  return [
    { label: isAdmin ? 'Pending approvals' : 'Rides shared', value: `${8 + (seed % 12)}` },
    { label: isAdmin ? 'Resolved reports' : 'Trusted matches', value: `${12 + (seed % 18)}` },
    { label: isAdmin ? 'Managed events' : 'Campus events', value: `${4 + (seed % 7)}` },
    { label: isAdmin ? 'Platform audits' : 'Saved deals', value: `${5 + (seed % 9)}` },
    { label: isAdmin ? 'Moderated chats' : 'Open chats', value: `${6 + (seed % 5)}` },
    { label: isAdmin ? 'Security reviews' : 'Service requests', value: `${2 + (seed % 4)}` }
  ];
}

export function buildAuthSessionFromApiResponse(
  response: unknown,
  rememberMe: boolean,
  emailHint: string
): AuthSession {
  const root = asRecord(response);
  const data = asRecord(root?.['data']);
  const sessionNode = asRecord(root?.['session']);
  
  const token = readString(sessionNode, ['token', 'accessToken', 'jwt']) ?? readString(root, ['token', 'accessToken', 'jwt']) ?? readString(data, ['token', 'accessToken', 'jwt']) ?? undefined;
  const refreshToken = readString(sessionNode, ['refreshToken']) ?? readString(root, ['refreshToken']) ?? readString(data, ['refreshToken']) ?? undefined;
  const tokenPayload = decodeJwtPayload(token);
  
  const user = asRecord(sessionNode?.['user']) ?? asRecord(root?.['user']) ?? asRecord(data?.['user']) ?? tokenPayload ?? data ?? root;

  const normalizedEmail = (readString(user, ['email', 'mail', 'username', 'sub']) ?? emailHint).trim().toLowerCase();
  const seed = hashValue(normalizedEmail);
  const department = readString(user, ['department']) ?? DEPARTMENTS[seed % DEPARTMENTS.length];
  const academicLevel = readString(user, ['academicLevel', 'level']) ?? LEVELS[seed % LEVELS.length];
  const fallbackNames = formatNames(normalizedEmail);
  const firstName = readString(user, ['firstName', 'firstname', 'givenName', 'username']) ?? fallbackNames.firstName;
  const lastName = readString(user, ['lastName', 'lastname', 'familyName']) ?? fallbackNames.lastName;

  // ✅ DB id converted to string
  const rawId = readValue(user, ['id', 'userId']);
  const id = rawId !== null ? String(rawId) : '';

  const role = normalizeRole(
    readString(user, ['role']) ?? readString(root, ['role']) ?? readString(data, ['role']),
    normalizedEmail
  );
  const isAdmin = role === 'admin';
  const highlights = Array.isArray(user?.['highlights']) && user['highlights'].every((entry) => typeof entry === 'string')
    ? (user['highlights'] as string[])
    : isAdmin
      ? ['Verified ESPRIT administrator', 'Access to moderation and approvals', 'Oversees secure student operations']
      : HIGHLIGHTS;

  return {
    accessToken: token,
    authenticatedAt: readString(root, ['authenticatedAt']) ?? new Date().toISOString(),
    rememberMe,
    refreshToken,
    user: {
      academicLevel,
      avatarUrl: readString(user, ['avatarUrl', 'avatar', 'imageUrl', 'photoUrl']) ?? createAvatarDataUrl(`${firstName} ${lastName}`),
      bio: readString(user, ['bio']) ?? (isAdmin
        ? 'Managing platform operations, approvals, and trust workflows for the ESPRIT community.'
        : `Focused on collaborative campus life, ${department.toLowerCase()}, and making daily student routines smoother through trusted connections.`),
      campus: readString(user, ['campus']) ?? 'ESPRIT Ariana',
      department,
      email: normalizedEmail,
      firstName,
      lastName,
      id,
      role,
      twoFactorEnabled: readBoolean(user, ['twoFactorEnabled']) ?? false,
      highlights,
      stats: buildDefaultStats(seed, role)
    }
  };
}
