import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

import { authErrorMessage } from '../utils/auth-errors';
import { signInSchema } from './sign-in';

export async function resendConfirmation(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = signInSchema.shape.email.safeParse(email.trim());
  if (!parsed.success) return { ok: false, message: t('auth.val.invalidEmail') };

  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email: parsed.data });
    if (error) return { ok: false, message: authErrorMessage(error, t('auth.err.resendFailed')) };
    return { ok: true };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}
