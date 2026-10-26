import { z } from 'zod';

import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';

export const signUpSchema = z
  .object({
    email: z.email('Enter a valid email.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string().min(1, 'Repeat your password.'),
    accepted: z.boolean().refine((v) => v, 'Accept the terms to create an account.'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: "Passwords don't match." });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpResult = { ok: true; signedIn: boolean } | { ok: false; message: string };

export async function signUpWithEmail({ email, password }: SignUpInput): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) return { ok: true, signedIn: !!data.session };
    return { ok: false, message: authErrorMessage(error, 'Couldn’t create your account. Try again.') };
  } catch {
    return { ok: false, message: 'Couldn’t connect. Check your connection and try again.' };
  }
}
