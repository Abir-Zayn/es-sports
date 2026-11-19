import { z } from 'zod';

import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

import { authErrorMessage } from '../utils/auth-errors';
import type { SignUpInput, SignUpResult } from '../types';

export const signUpSchema = z
  .object({
    email: z.email({ error: () => t('auth.val.invalidEmail') }),
    password: z.string().min(8, { error: () => t('auth.val.minPassword') }),
    confirm: z.string().min(1, { error: () => t('auth.val.repeatPassword') }),
    accepted: z.boolean().refine((v) => v, { error: () => t('auth.val.acceptTerms') }),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], error: () => t('auth.val.passwordMismatch') });

export async function signUpWithEmail({ email, password }: SignUpInput): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) return { ok: true, signedIn: !!data.session };
    return { ok: false, message: authErrorMessage(error, t('auth.err.signUpFailed')) };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}
