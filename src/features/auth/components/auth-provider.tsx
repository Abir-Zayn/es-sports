import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

type AuthValue = { session: Session | null; isLoading: boolean };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = useRef<string | null>(null);

  useEffect(() => {
    // INITIAL_SESSION restores stored credentials without a competing getSession request.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      const nextId = next?.user.id ?? null;
      if (nextId !== userId.current) {
        queryClient.clear();
        userId.current = nextId;
      }
      setSession(next);
      setIsLoading(false);
    });

    if (Platform.OS === 'web') return () => subscription.unsubscribe();

    function refreshForState(state: string | null | undefined) {
      if (state === 'active') void supabase.auth.startAutoRefresh();
      else void supabase.auth.stopAutoRefresh();
    }

    refreshForState(AppState.currentState);
    const appState = AppState.addEventListener('change', refreshForState);
    return () => {
      subscription.unsubscribe();
      appState.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
