// Auth context for Trini Side Hustle — backed by Supabase. Login is required.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from './supabase';
import type { UserRole } from './types';

interface AuthState {
  loading: boolean;
  session: Session | null;
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setRole: (r: UserRole) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRoleState] = useState<UserRole>('customer');

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem('tt_role').then((r) => {
      if (mounted && (r === 'customer' || r === 'tradesman' || r === 'both')) setRoleState(r);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    AsyncStorage.setItem('tt_role', r);
  };

  const value: AuthState = {
    loading,
    session,
    signedIn: !!session,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    role,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password, fullName) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return error ? { error: error.message } : {};
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
    },
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
