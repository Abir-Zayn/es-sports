import { act, renderHook, waitFor } from '@testing-library/react-native';
import { StrictMode, type ReactNode } from 'react';

import { openRecoverySession } from '../password-recovery';
import { useRecoverySession } from '../use-recovery-session';

jest.mock('../password-recovery', () => ({
  INVALID_RECOVERY_LINK: 'Invalid recovery link', openRecoverySession: jest.fn(),
}));

const open = jest.mocked(openRecoverySession);
type Result = Awaited<ReturnType<typeof openRecoverySession>>;

beforeEach(() => jest.resetAllMocks());

it('does not establish a session from a direct visit with no link', async () => {
  const { result } = await renderHook(() => useRecoverySession(undefined));
  expect(result.current.state).toMatchObject({ status: 'error', retryable: false });
  expect(open).not.toHaveBeenCalled();
});

it('establishes the session only once under Strict Mode', async () => {
  open.mockResolvedValue({ ok: true, userId: 'player' });
  const { result } = await renderHook(() => useRecoverySession('first-link'), {
    wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
  });
  await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', userId: 'player' }));
  expect(open).toHaveBeenCalledTimes(1);
});

it('ignores a superseded verification result when another link arrives', async () => {
  let finishFirst!: (value: Result) => void;
  open.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }));
  open.mockResolvedValueOnce({ ok: true, userId: 'second-player' });
  const { result, rerender } = await renderHook((fragment: string) => useRecoverySession(fragment), { initialProps: 'first-link' });
  await rerender('second-link');
  expect(open).toHaveBeenCalledTimes(2);
  await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', userId: 'second-player' }));
  await act(() => finishFirst({ ok: true, userId: 'first-player' }));
  await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', userId: 'second-player' }));
  expect(open.mock.calls).toEqual([['first-link'], ['second-link']]);
});

it('ignores completion after unmount', async () => {
  let finish!: (value: Result) => void;
  open.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const { unmount } = await renderHook(() => useRecoverySession('first-link'));
  await unmount();
  await act(() => finish({ ok: true, userId: 'player' }));
  expect(open).toHaveBeenCalledTimes(1);
});
