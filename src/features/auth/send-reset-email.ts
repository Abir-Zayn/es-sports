import { createURL } from 'expo-linking';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';
import { signInSchema } from './sign-in';

export const resetRequestSchema = z.object({
  email: signInSchema.shape.email,
});

export type SendResetResult = { ok: true } | { ok: false; message: string };

export async function sendResetEmail(email: string): Promise<SendResetResult> {
  const parsed = resetRequestSchema.shape.email.safeParse(email.trim());
  if (!parsed.success) return { ok: false, message: 'Enter a valid email.' };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: createURL('reset-password', { scheme: 'essports' }),
    });
    if (error && error.code !== 'user_not_found') {
      const limited = ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(error.code ?? '');
      return { ok: false, message: limited ? authErrorMessage(error, '') : 'Couldn’t send the reset email. Try again later.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Couldn’t connect. Check your connection and try again.' };
  }
}
