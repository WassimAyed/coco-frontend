const AUTH_SESSION_COOKIE_KEY = 'coco-auth-session';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const cookieEntry = document.cookie
    .split('; ')
    .find(value => value.startsWith(prefix));

  if (!cookieEntry) {
    return null;
  }

  return decodeURIComponent(cookieEntry.slice(prefix.length));
}

function readTokenFromSessionCookie(): string | null {
  const rawSession = readCookie(AUTH_SESSION_COOKIE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as { accessToken?: string };
    return parsed?.accessToken?.trim() || null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const payload = atob(normalized);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  const localStorageToken = localStorage.getItem('accessToken')?.trim()
    || localStorage.getItem('token')?.trim();

  if (localStorageToken) {
    return localStorageToken;
  }

  return readTokenFromSessionCookie();
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.['exp'];

  if (typeof exp !== 'number') {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds;
}

export function hasValidAuthToken(): boolean {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  return !isTokenExpired(token);
}