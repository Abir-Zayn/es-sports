import { createClient } from '@supabase/supabase-js';

import { env } from './env';

// Session persistence is added with the auth feature (encrypted SecureStore pattern).
export const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: false, detectSessionInUrl: false },
});
