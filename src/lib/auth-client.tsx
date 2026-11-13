'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  login?: string;
}

interface Session {
  user: User;
  accessToken: string;
  expires: string;
}

interface AuthContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      console.log('[Auth] Session response status:', res.status);
      const data = await res.json();
      console.log('[Auth] Session data:', data);
      if (data && data.user) {
        setSession(data);
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.error('[Auth] Session fetch error:', err);
      setSession(null);
      setStatus('unauthenticated');
    }
  };

  const update = async () => {
    await fetchSession();
  };

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setSession(null);
    setStatus('unauthenticated');
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ session, status, update, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}