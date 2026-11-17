import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';
import { signInSchema } from './sign-in';

export async function resendConfirmation(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = signInSchema.shape.email.safeParse(email.trim());
  if (!parsed.success) return { ok: false, message: 'Enter a valid email.' };

  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email: parsed.data });
    if (error) return { ok: false, message: authErrorMessage(error, 'Couldn’t resend the email. Try again.') };
    return { ok: true };
  } catch {
    return { ok: false, message: 'Couldn’t connect. Check your connection and try again.' };
  }
}
