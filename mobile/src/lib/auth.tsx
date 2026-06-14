// Auth context for Trini Tradesman.
// Works against Supabase when configured (mobile/.env). If Supabase isn't set up
// yet, a "demo mode" lets you view the app without a backend.
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

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const isSupabaseConfigured =
  url.startsWith('https://') && !url.includes('YOUR-PROJECT');

const NOT_CONFIGURED = {
  error:
    'Supabase isn’t connected yet (see mobile/.env). For now, tap "Continue without an account".',
};

interface AuthState {
  loading: boolean;
  session: Session | null;
  isDemo: boolean;
  signedIn: boolean;
  role: UserRole;
  email: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  continueDemo: () => void;
  setRole: (r: UserRole) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [role, setRoleState] = useState<UserRole>('customer');

  useEffect(() => {
    let mounted = true;

    // Restore the saved role (customer vs tradesman view).
    AsyncStorage.getItem('tt_role').then((r) => {
      if (mounted && (r === 'customer' || r === 'tradesman' || r === 'both')) {
        setRoleState(r);
      }
    });

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

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
    isDemo,
    signedIn: !!session || isDemo,
    role,
    email: session?.user?.email ?? (isDemo ? 'demo@trinitradesman.tt' : null),
    signIn: async (email, password) => {
      if (!isSupabaseConfigured) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password, fullName) => {
      if (!isSupabaseConfigured) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return error ? { error: error.message } : {};
    },
    signOut: async () => {
      setIsDemo(false);
      if (isSupabaseConfigured) await supabase.auth.signOut();
      setSession(null);
    },
    continueDemo: () => setIsDemo(true),
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
