import { AuthSession } from '../models/user.model';
import { buildAuthSessionFromApiResponse } from './user-profile.util';

const AUTH_SESSION_KEY = 'coco-auth-session';
const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const EXPIRED_COOKIE_DATE = 'Thu, 01 Jan 1970 00:00:00 GMT';

interface StoredAuthSession {
  accessToken?: string;
  authenticatedAt?: string;
  refreshToken?: string;
  rememberMe?: boolean;
}

const LEGACY_STORAGE_KEYS = [
  AUTH_SESSION_KEY,
  'userId',
  'ownerId',
  'currentUser',
];

function hasDocument(): boolean {
  return typeof document !== 'undefined';
}

function getCookieAttributes(maxAgeSeconds?: number): string {
  const attributes = ['Path=/', 'SameSite=Lax'];

  if (typeof location !== 'undefined' && location.protocol === 'https:') {
    attributes.push('Secure');
  }

  if (typeof maxAgeSeconds === 'number') {
    attributes.push(`Max-Age=${maxAgeSeconds}`);

    if (maxAgeSeconds === 0) {
      attributes.push(`Expires=${EXPIRED_COOKIE_DATE}`);
    }
  }

  return attributes.join('; ');
}

function readCookie(name: string): string | null {
  if (!hasDocument()) {
    return null;
  }

  const cookiePrefix = `${encodeURIComponent(name)}=`;
  const rawCookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(cookiePrefix));

  if (!rawCookie) {
    return null;
  }

  return decodeURIComponent(rawCookie.slice(cookiePrefix.length));
}

function writeCookie(name: string, value: string, maxAgeSeconds?: number): void {
  if (!hasDocument()) {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${getCookieAttributes(maxAgeSeconds)}`;
}

export function loadAuthSession(): AuthSession | null {
  clearLegacyBrowserStorage();
  const rawSession = readCookie(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawSession) as AuthSession | StoredAuthSession;

    if ('user' in parsedValue && parsedValue.user) {
      return parsedValue as AuthSession;
    }

    const compactSession = parsedValue as StoredAuthSession;
    if (!compactSession.accessToken?.trim()) {
      clearAuthSession();
      return null;
    }

    const restoredSession = buildAuthSessionFromApiResponse(
      {
        accessToken: compactSession.accessToken,
        authenticatedAt: compactSession.authenticatedAt,
        refreshToken: compactSession.refreshToken,
      },
      compactSession.rememberMe ?? true,
      '',
    );

    return restoredSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: AuthSession, rememberMe: boolean): void {
  clearLegacyBrowserStorage();
  const compactSession: StoredAuthSession = {
    accessToken: session.accessToken,
    authenticatedAt: session.authenticatedAt,
    refreshToken: session.refreshToken,
    rememberMe,
  };

  writeCookie(
    AUTH_SESSION_KEY,
    JSON.stringify(compactSession),
    rememberMe ? AUTH_SESSION_MAX_AGE_SECONDS : undefined,
  );
}

export function clearAuthSession(): void {
  clearLegacyBrowserStorage();
  writeCookie(AUTH_SESSION_KEY, '', 0);
}

function clearLegacyBrowserStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore cleanup failures.
  }
}
