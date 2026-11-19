import { t } from '@/i18n';
import { forgetPushToken } from '@/lib/push-token';
import { supabase } from '@/lib/supabase';

export async function signOut(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    // While still signed in: RLS lets the user delete only their own token.
    await forgetPushToken();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (!error) return { ok: true };
  } catch {
    // Keep the current screen and allow retry if revocation or secure storage fails.
  }
  return { ok: false, message: t('auth.err.signOutFailed') };
}
