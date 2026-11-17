import { supabase } from '@/lib/supabase';

export async function signOut(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (!error) return { ok: true };
  } catch {
    // Keep the current screen and allow retry if revocation or secure storage fails.
  }
  return { ok: false, message: 'Couldn’t log out. Check your connection and try again.' };
}
