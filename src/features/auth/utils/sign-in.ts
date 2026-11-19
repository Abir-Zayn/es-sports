import { z } from 'zod';

import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';
import type { SignInInput, SignInResult } from '../types';

export const signInSchema = z.object({
  email: z.email({ error: () => t('auth.val.invalidEmail') }),
  password: z.string().min(1, { error: () => t('auth.val.enterPassword') }),
});

export async function signInWithEmail({ email, password }: SignInInput): Promise<SignInResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) return { ok: true };
    return {
      ok: false,
      message: authErrorMessage(error ?? {}, t('auth.err.signInFailed')),
      needsConfirmation: error?.code === 'email_not_confirmed',
    };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}
