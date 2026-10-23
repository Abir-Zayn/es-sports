import { z } from 'zod';

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
    // Loaded on demand: the client reads env at import time and throws while the project has no .env.
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) return { ok: true, signedIn: !!data.session };
    if (error.code === 'user_already_exists') {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    if (error.code === 'weak_password') {
      return { ok: false, message: 'That password is too easy to guess. Try another.' };
    }
    return { ok: false, message: "Couldn't create your account. Try again." };
  } catch {
    return { ok: false, message: "Sign-up isn't available right now. Try again later." };
  }
}
