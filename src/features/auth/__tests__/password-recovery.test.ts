import { supabase } from '@/lib/supabase';

import { INVALID_RECOVERY_LINK, newPasswordSchema, openRecoverySession, saveRecoveredPassword } from '../password-recovery';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { setSession: jest.fn(), getUser: jest.fn(), updateUser: jest.fn() } },
}));

const fragment = 'access_token=access&refresh_token=refresh&type=recovery';
const input = { password: 'NewCricket123!', confirm: 'NewCricket123!' };
const auth = jest.mocked(supabase.auth);

beforeEach(() => {
  jest.resetAllMocks();
  auth.getUser.mockResolvedValue({ data: { user: { id: 'player' } }, error: null } as never);
  auth.updateUser.mockResolvedValue({ data: { user: { id: 'player' } }, error: null } as never);
});

it.each(['', 'type=recovery', 'access_token=access&type=recovery', fragment.replace('recovery', 'signup'),
  `${fragment}&error=access_denied`, 'error_code=otp_expired&error_description=internal%20detail']) (
  'rejects missing, incomplete, non-recovery and expired fragments without a session mutation: %s', async (value) => {
    expect(await openRecoverySession(value)).toEqual({ ok: false, retryable: false, message: INVALID_RECOVERY_LINK });
    expect(auth.setSession).not.toHaveBeenCalled();
  },
);

it('establishes the recovery session using both tokens', async () => {
  auth.setSession.mockResolvedValue({ data: { session: {}, user: { id: 'player' } }, error: null } as never);
  expect(await openRecoverySession(`#${fragment}`)).toEqual({ ok: true, userId: 'player' });
  expect(auth.setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
});

it('requires a returned user and session', async () => {
  auth.setSession.mockResolvedValue({ data: { session: null, user: null }, error: null } as never);
  expect(await openRecoverySession(fragment)).toMatchObject({ ok: false, retryable: false });
});

it.each([
  [{ status: 401, message: 'sensitive detail' }, false],
  [{ status: 0 }, true], [{ status: 503 }, true], [{ status: 429 }, true],
])('distinguishes invalid sessions from temporary failures', async (error, retryable) => {
  auth.setSession.mockResolvedValue({ data: {}, error } as never);
  expect(await openRecoverySession(fragment)).toMatchObject({ ok: false, retryable });
});

it('allows retrying after a thrown network error without exposing tokens or server details', async () => {
  auth.setSession.mockRejectedValue(new Error(fragment));
  expect(await openRecoverySession(fragment)).toEqual({
    ok: false, retryable: true, message: 'Couldn’t connect. Check your connection and try again.',
  });
});

it('requires matching passwords and the same minimum length as sign-up', async () => {
  expect(newPasswordSchema.safeParse(input).success).toBe(true);
  for (const changes of [{ password: 'short', confirm: 'short' }, { confirm: 'different' }, { confirm: '' }]) {
    expect((await saveRecoveredPassword({ ...input, ...changes }, 'player')).ok).toBe(false);
  }
  expect(auth.getUser).not.toHaveBeenCalled();
  expect(auth.updateUser).not.toHaveBeenCalled();
});

it('revalidates the recovery identity before updating only the password', async () => {
  expect(await saveRecoveredPassword(input, 'player')).toEqual({ ok: true });
  expect(auth.getUser).toHaveBeenCalledTimes(1);
  expect(auth.updateUser).toHaveBeenCalledWith({ password: input.password });
});

it('prevents an account switch from updating a different user', async () => {
  auth.getUser.mockResolvedValue({ data: { user: { id: 'different-player' } }, error: null } as never);
  expect(await saveRecoveredPassword(input, 'player')).toMatchObject({ ok: false, retryable: false });
  expect(auth.updateUser).not.toHaveBeenCalled();
});

it.each([0, 401, 503])('handles failed server validation (%s) without saving', async (status) => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: { status } } as never);
  expect(await saveRecoveredPassword(input, 'player')).toMatchObject({ ok: false, retryable: status !== 401 });
  expect(auth.updateUser).not.toHaveBeenCalled();
});

it.each([
  ['same_password', true, 'different from your current'],
  ['weak_password', true, 'too easy to guess'],
  ['session_not_found', false, 'invalid or has expired'],
])('handles %s when updating', async (code, retryable, message) => {
  auth.updateUser.mockResolvedValue({ data: {}, error: { code } } as never);
  expect(await saveRecoveredPassword(input, 'player')).toMatchObject({ ok: false, retryable, message: expect.stringContaining(message) });
});

it('does not claim success if the password update fails', async () => {
  auth.updateUser.mockRejectedValue(new Error('offline'));
  expect(await saveRecoveredPassword(input, 'player')).toMatchObject({ ok: false, retryable: true });
});

it('waits for an active password save before accepting a link for another account', async () => {
  let finishUpdate!: (value: Awaited<ReturnType<typeof supabase.auth.updateUser>>) => void;
  let started!: () => void;
  const updating = new Promise<void>((resolve) => { started = resolve; });
  auth.updateUser.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => { finishUpdate = resolve; });
  });
  auth.setSession.mockResolvedValue({ data: { session: {}, user: { id: 'second-player' } }, error: null } as never);
  const save = saveRecoveredPassword(input, 'player');
  await updating;
  const open = openRecoverySession(fragment);
  await Promise.resolve();
  expect(auth.setSession).not.toHaveBeenCalled();
  finishUpdate({ data: { user: { id: 'player' } }, error: null } as never);
  expect(await save).toEqual({ ok: true });
  expect(await open).toEqual({ ok: true, userId: 'second-player' });
});
