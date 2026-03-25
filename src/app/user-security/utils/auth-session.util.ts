import { AuthSession } from '../models/user.model';

const AUTH_SESSION_KEY = 'coco-auth-session';
const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const EXPIRED_COOKIE_DATE = 'Thu, 01 Jan 1970 00:00:00 GMT';

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
  const rawSession = readCookie(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: AuthSession, rememberMe: boolean): void {
  writeCookie(
    AUTH_SESSION_KEY,
    JSON.stringify(session),
    rememberMe ? AUTH_SESSION_MAX_AGE_SECONDS : undefined
  );
}

export function clearAuthSession(): void {
  writeCookie(AUTH_SESSION_KEY, '', 0);
}
