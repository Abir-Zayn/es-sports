import { z } from 'zod';

import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';
import { signInSchema } from './sign-in';

export const resetRequestSchema = z.object({
  email: signInSchema.shape.email,
});

export type SendResetResult = { ok: true } | { ok: false; message: string };

// Only rate limits surface an error: reporting anything else would reveal whether the account exists.
const RATE_LIMIT_CODES = new Set(['over_email_send_rate_limit', 'over_request_rate_limit']);

export async function sendResetEmail(email: string): Promise<SendResetResult> {
  const parsed = resetRequestSchema.shape.email.safeParse(email.trim());
  if (!parsed.success) return { ok: false, message: 'Enter a valid email.' };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data);
    if (error && RATE_LIMIT_CODES.has(error.code ?? '')) {
      return { ok: false, message: authErrorMessage(error, 'Couldn’t send the reset email. Try again.') };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Couldn’t connect. Check your connection and try again.' };
  }
}
