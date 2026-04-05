import { createStore } from 'zustand/vanilla';
import { AuthSession } from '../models/user.model';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../utils/auth-session.util';
import { createAvatarDataUrl } from '../../shared/utils/avatar.util';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthStoreState {
  session: AuthSession | null;
  status: AuthStatus;
  error: string | null;
  updateProfile: (updates: Partial<AuthSession['user']>) => void;
  logout: () => void;
  restoreSession: () => void;
  clearError: () => void;
  setError: (message: string) => void;
  setLoading: () => void;
  setSession: (session: AuthSession) => void;
}

export const authStore = createStore<AuthStoreState>((set) => ({
  clearError: () => {
    set((state) => ({
      error: null,
      status: state.session ? 'authenticated' : 'idle'
    }));
  },
  error: null,
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
          avatarUrl:
            updates.avatarUrl ??
            state.session.user.avatarUrl ??
            createAvatarDataUrl(`${firstName} ${lastName}`)
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
  setError: (message) => {
    set({
      error: message,
      session: null,
      status: 'error'
    });
  },
  setLoading: () => {
    set({
      error: null,
      status: 'loading'
    });
  },
  setSession: (session) => {
    saveAuthSession(session, session.rememberMe);
    set({
      error: null,
      session,
      status: 'authenticated'
    });
  },
  session: null,
  status: 'idle'
}));
