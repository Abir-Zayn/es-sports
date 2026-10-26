import { z } from 'zod';

import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';

export const signInSchema = z.object({
  email: z.email('Enter a valid email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignInResult = { ok: true } | { ok: false; message: string; needsConfirmation?: boolean };

export async function signInWithEmail({ email, password }: SignInInput): Promise<SignInResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) return { ok: true };
    return {
      ok: false,
      message: authErrorMessage(error ?? {}, 'Couldn’t log in. Try again.'),
      needsConfirmation: error?.code === 'email_not_confirmed',
    };
  } catch {
    return { ok: false, message: 'Couldn’t connect. Check your connection and try again.' };
  }
}
