import { supabase } from '@/lib/supabase';

import { resendConfirmation } from '../resend-confirmation';
import { signInSchema, signInWithEmail } from '../sign-in';
import { signOut } from '../sign-out';
import { signUpSchema, signUpWithEmail } from '../sign-up';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn(), signUp: jest.fn(), resend: jest.fn(), signOut: jest.fn() } },
}));

const input = { email: 'player@example.com', password: 'Cricket123!', confirm: 'Cricket123!', accepted: true };

beforeEach(() => jest.resetAllMocks());

it('requires valid email, matching passwords, minimum length and accepted terms', () => {
  expect(signInSchema.safeParse({ email: 'invalid', password: '' }).success).toBe(false);
  expect(signUpSchema.safeParse(input).success).toBe(true);
  for (const changes of [{ email: 'invalid' }, { password: 'short' }, { confirm: 'different' }, { accepted: false }]) {
    expect(signUpSchema.safeParse({ ...input, ...changes }).success).toBe(false);
  }
});

it('uses password authentication and requires a returned session', async () => {
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { session: {} }, error: null } as never);
  expect(await signInWithEmail(input)).toEqual({ ok: true });
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: input.email, password: input.password });
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { session: null }, error: null } as never);
  expect((await signInWithEmail(input)).ok).toBe(false);
});

it.each([
  ['invalid_credentials', 'Email or password is wrong.'],
  ['over_request_rate_limit', 'Too many attempts. Wait a minute and try again.'],
])('maps %s without exposing server internals', async (code, message) => {
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: { code, message: 'internal detail' } } as never);
  expect(await signInWithEmail(input)).toMatchObject({ ok: false, message });
});

it('offers resending when an email has not been confirmed', async () => {
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: { code: 'email_not_confirmed' } } as never);
  expect(await signInWithEmail(input)).toMatchObject({ ok: false, needsConfirmation: true });
});

it.each([null, { access_token: 'session' }])('handles signup with confirmation enabled or disabled', async (session) => {
  jest.mocked(supabase.auth.signUp).mockResolvedValue({ data: { session }, error: null } as never);
  expect(await signUpWithEmail(input)).toEqual({ ok: true, signedIn: !!session });
  expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: input.email, password: input.password });
});

it('allows retry after a network failure', async () => {
  jest.mocked(supabase.auth.signUp).mockRejectedValue(new Error('offline'));
  expect(await signUpWithEmail(input)).toMatchObject({ ok: false, message: expect.stringContaining('connection') });
});

it('validates the resend address and uses signup confirmation rather than passwordless login', async () => {
  expect((await resendConfirmation('invalid')).ok).toBe(false);
  expect(supabase.auth.resend).not.toHaveBeenCalled();
  jest.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: null } as never);
  expect(await resendConfirmation(' player@example.com ')).toEqual({ ok: true });
  expect(supabase.auth.resend).toHaveBeenCalledWith({ type: 'signup', email: input.email });
});

it('surfaces confirmation delivery limits', async () => {
  jest.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: { code: 'over_email_send_rate_limit' } } as never);
  expect(await resendConfirmation(input.email)).toMatchObject({ ok: false, message: expect.stringContaining('Wait a minute') });
});

it('revokes only the current device session and reports failed logout', async () => {
  jest.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
  expect(await signOut()).toEqual({ ok: true });
  expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  jest.mocked(supabase.auth.signOut).mockRejectedValue(new Error('offline'));
  expect((await signOut()).ok).toBe(false);
});
