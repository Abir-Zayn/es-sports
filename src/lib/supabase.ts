import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { authStorage } from './auth-storage';
import type { Database } from './database.types';
import { env } from './env';
import { fetchWithTimeout } from './fetch-with-timeout';

export const supabase = createClient<Database>(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_KEY, {
  global: { fetch: fetchWithTimeout },
  auth: {
    ...(Platform.OS !== 'web' ? { storage: authStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
