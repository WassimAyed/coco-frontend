import { createStore } from 'zustand/vanilla';
import { AuthSession, LoginCredentials } from '../models/user.model';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../utils/auth-session.util';
import { buildAuthSession } from '../utils/user-profile.util';
import { createAvatarDataUrl } from '../../shared/utils/avatar.util';

const AUTH_DELAY_MS = 1400;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isEspritEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@esprit.tn');
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthStoreState {
  session: AuthSession | null;
  status: AuthStatus;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  updateProfile: (updates: Partial<AuthSession['user']>) => void;
  logout: () => void;
  restoreSession: () => void;
  clearError: () => void;
}

export const authStore = createStore<AuthStoreState>((set) => ({
  clearError: () => {
    set((state) => ({
      error: null,
      status: state.session ? 'authenticated' : 'idle'
    }));
  },
  error: null,
  async login(credentials) {
    set({
      error: null,
      status: 'loading'
    });

    await wait(AUTH_DELAY_MS);

    if (!isEspritEmail(credentials.email)) {
      const message = 'Use your ESPRIT email address to continue.';
      set({
        error: message,
        session: null,
        status: 'error'
      });
      throw new Error(message);
    }

    if (!credentials.password.trim()) {
      const message = 'Password is required.';
      set({
        error: message,
        session: null,
        status: 'error'
      });
      throw new Error(message);
    }

    const session = buildAuthSession(credentials.email, credentials.rememberMe);
    saveAuthSession(session, credentials.rememberMe);

    set({
      error: null,
      session,
      status: 'authenticated'
    });

    return session;
  },
  logout: () => {
    clearAuthSession();
    set({
      error: null,
      session: null,
      status: 'idle'
    });
  },
  updateProfile: (updates) => {
    set((state) => {
      if (!state.session) {
        return state;
      }

      const firstName = updates.firstName ?? state.session.user.firstName;
      const lastName = updates.lastName ?? state.session.user.lastName;
      const nextSession: AuthSession = {
        ...state.session,
        user: {
          ...state.session.user,
          ...updates,
          avatarUrl: updates.avatarUrl ?? createAvatarDataUrl(`${firstName} ${lastName}`)
        }
      };

      saveAuthSession(nextSession, nextSession.rememberMe);

      return {
        error: null,
        session: nextSession,
        status: 'authenticated'
      };
    });
  },
  restoreSession: () => {
    const session = loadAuthSession();

    set({
      error: null,
      session,
      status: session ? 'authenticated' : 'idle'
    });
  },
  session: null,
  status: 'idle'
}));
