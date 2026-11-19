import { createURL } from 'expo-linking';
import { z } from 'zod';

import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';
import { signInSchema } from './sign-in';
import type { SendResetResult } from '../types';

export const resetRequestSchema = z.object({
  email: signInSchema.shape.email,
});

export async function sendResetEmail(email: string): Promise<SendResetResult> {
  const parsed = resetRequestSchema.shape.email.safeParse(email.trim());
  if (!parsed.success) return { ok: false, message: t('auth.val.invalidEmail') };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: createURL('reset-password', { scheme: 'essports' }),
    });
    if (error && error.code !== 'user_not_found') {
      const limited = ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(error.code ?? '');
      return { ok: false, message: limited ? authErrorMessage(error, '') : t('auth.err.resetSendFailed') };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}
