import { AuthSession } from '../models/user.model';

const AUTH_SESSION_KEY = 'coco-auth-session';

function hasLocalStorage(): boolean {
  return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

export function loadAuthSession(): AuthSession | null {
  if (!hasLocalStorage()) {
    return null;
  }

  const rawSession = globalThis.localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    globalThis.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession, rememberMe: boolean): void {
  if (!hasLocalStorage()) {
    return;
  }

  if (!rememberMe) {
    globalThis.localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  globalThis.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (!hasLocalStorage()) {
    return;
  }

  globalThis.localStorage.removeItem(AUTH_SESSION_KEY);
}
