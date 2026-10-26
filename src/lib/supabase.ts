import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { authStorage } from './auth-storage';
import { env } from './env';

export const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_KEY, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: authStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
