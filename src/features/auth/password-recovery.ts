import { z } from 'zod';

import { supabase } from '@/lib/supabase';

import { authErrorMessage } from './auth-errors';
import { signUpSchema } from './sign-up';

export const INVALID_RECOVERY_LINK = 'This reset link is invalid or has expired. Request a new link and try again.';
const CONNECTION_ERROR = 'Couldn’t connect. Check your connection and try again.';
type Failure = { ok: false; message: string; retryable: boolean };
type RecoveryResult = { ok: true; userId: string } | Failure;
let recoveryWork: Promise<unknown> = Promise.resolve();

// Auth mutations cannot be cancelled through the SDK. Keep them ordered even
// across screen unmounts so a newer link cannot change the account during a save.
function serializeRecovery<T>(operation: () => Promise<T>): Promise<T> {
  const result = recoveryWork.then(operation);
  recoveryWork = result.catch(() => undefined);
  return result;
}
const credentialsSchema = z.object({
  type: z.literal('recovery'),
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export const newPasswordSchema = z.object({
  password: signUpSchema.shape.password,
  confirm: z.string().min(1, 'Repeat your password.'),
}).refine((input) => input.password === input.confirm, {
  path: ['confirm'], message: 'Passwords don’t match.',
});

function recoveryFailure(error: { status?: number; code?: string } | null): Failure {
  const limited = error?.status === 429 || ['over_request_rate_limit', 'over_email_send_rate_limit'].includes(error?.code ?? '');
  const retryable = limited || error?.status === 0 || (error?.status ?? 0) >= 500;
  return { ok: false, retryable, message: limited ? 'Too many attempts. Wait a minute and try again.'
    : retryable ? CONNECTION_ERROR : INVALID_RECOVERY_LINK };
}

/** Only Supabase recovery fragments can establish a password reset session. */
export function openRecoverySession(fragment: string): Promise<RecoveryResult> {
  return serializeRecovery(() => establishRecoverySession(fragment));
}

async function establishRecoverySession(fragment: string): Promise<RecoveryResult> {
  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  if (params.has('error') || params.has('error_code')) return recoveryFailure(null);
  const parsed = credentialsSchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return recoveryFailure(null);
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.data.access_token, refresh_token: parsed.data.refresh_token,
    });
    if (error || !data?.session || !data?.user?.id) return recoveryFailure(error);
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, retryable: true, message: CONNECTION_ERROR };
  }
}

export function saveRecoveredPassword(
  input: z.infer<typeof newPasswordSchema>, userId: string,
): Promise<{ ok: true } | Failure> {
  return serializeRecovery(() => updateRecoveredPassword(input, userId));
}

async function updateRecoveredPassword(
  input: z.infer<typeof newPasswordSchema>, userId: string,
): Promise<{ ok: true } | Failure> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, retryable: true, message: parsed.error.issues[0].message };
  try {
    // Revalidate with the server: a restored or switched account cannot reuse this form.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id || data.user.id !== userId) return recoveryFailure(error);
    const updated = await supabase.auth.updateUser({ password: parsed.data.password });
    if (!updated.error && updated.data?.user?.id === userId) return { ok: true };
    if (updated.error?.status === 401 || ['session_not_found', 'refresh_token_not_found', 'bad_jwt'].includes(updated.error?.code ?? '')) {
      return recoveryFailure(updated.error);
    }
    const message = updated.error?.code === 'same_password'
      ? 'Choose a password different from your current password.'
      : authErrorMessage(updated.error ?? {}, 'Couldn’t update your password. Try again.');
    return { ok: false, retryable: true, message };
  } catch {
    return { ok: false, retryable: true, message: CONNECTION_ERROR };
  }
}
