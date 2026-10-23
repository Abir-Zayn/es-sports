import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email('Enter a valid email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignInResult = { ok: true } | { ok: false; message: string };

export async function signInWithEmail({ email, password }: SignInInput): Promise<SignInResult> {
  try {
    // Loaded on demand: the client reads env at import time and throws while the project has no .env.
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { ok: true };
    return {
      ok: false,
      message: error.code === 'invalid_credentials' ? 'Email or password is wrong.' : "Couldn't log in. Try again.",
    };
  } catch {
    return { ok: false, message: "Login isn't available right now. Try again later." };
  }
}
