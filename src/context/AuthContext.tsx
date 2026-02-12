'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { MOCK_ME } from '@/lib/mock-data';

const STORAGE_KEY = 'snaptap_test_mode';
const AVATAR_STORAGE_KEY = 'snaptap_test_avatar';

export type User = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  useApiMode: boolean;
  loginMock: () => void;
  setTestMode: (v: boolean) => void;
  testMode: boolean;
  signInGtaw: () => void;
  logout: () => Promise<void>;
  updateAvatar: (url: string) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredAvatar(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AVATAR_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [testMode, setTestModeState] = useState(true);

  const useApiMode = !!session?.user?.gtawId;

  const fetchMe = useCallback(async () => {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
    } as User;
  }, []);

  const refreshUser = useCallback(async () => {
    if (session?.user?.gtawId) {
      const profile = await fetchMe();
      if (profile) setUser(profile);
    }
  }, [session?.user?.gtawId, fetchMe]);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.gtawId) {
      fetchMe().then((profile) => setUser(profile));
      return;
    }
    setUser(null);
  }, [session?.user?.gtawId, status, fetchMe]);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      const stored = localStorage.getItem(STORAGE_KEY) === 'true';
      setTestModeState(stored);
      if (stored) {
        const avatar = getStoredAvatar();
        setUser({ ...MOCK_ME, avatarUrl: avatar || MOCK_ME.avatarUrl });
      }
    }
  }, [session, status]);

  const setTestMode = useCallback((v: boolean) => {
    setTestModeState(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(v));
      if (!v) setUser(null);
      else {
        const avatar = getStoredAvatar();
        setUser({ ...MOCK_ME, avatarUrl: avatar || MOCK_ME.avatarUrl });
      }
    }
  }, []);

  const loginMock = useCallback(() => {
    const avatar = getStoredAvatar();
    setUser({ ...MOCK_ME, avatarUrl: avatar || MOCK_ME.avatarUrl });
    setTestModeState(true);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const signInGtaw = useCallback(() => {
    signIn('gtaw');
  }, []);

  const logout = useCallback(async () => {
    if (session) {
      await signOut();
      setUser(null);
    } else {
      setUser(null);
    }
  }, [session]);

  const updateAvatar = useCallback(
    async (url: string) => {
      if (useApiMode) {
        const res = await fetch('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ avatarUrl: url }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser((prev) => (prev ? { ...prev, avatarUrl: data.avatarUrl } : null));
        }
      } else {
        setUser((prev) => {
          if (!prev) return prev;
          if (typeof window !== 'undefined') localStorage.setItem(AVATAR_STORAGE_KEY, url);
          return { ...prev, avatarUrl: url };
        });
      }
    },
    [useApiMode]
  );

  const loading = status === 'loading';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        useApiMode,
        loginMock,
        setTestMode,
        testMode,
        signInGtaw,
        logout,
        updateAvatar,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
