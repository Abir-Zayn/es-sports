import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/theme';

import { ForgotPasswordScreen } from '../forgot-password-screen';
import { ResetPasswordScreen } from '../reset-password-screen';

jest.mock('@/lib/supabase', () => ({ supabase: { auth: {
  setSession: jest.fn(), getUser: jest.fn(), updateUser: jest.fn(), resetPasswordForEmail: jest.fn(),
} } }));
jest.mock('expo-linking', () => ({ createURL: () => 'essports://reset-password' }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(), router: { replace: jest.fn(), setParams: jest.fn() },
  Link: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null), setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));

const auth = jest.mocked(supabase.auth);
const fragment = 'access_token=access&refresh_token=refresh&type=recovery';
const withTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const enterPassword = async () => {
  await fireEvent.changeText(screen.getByLabelText('New password'), 'NewCricket123!');
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'NewCricket123!');
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({ '#': fragment });
  auth.setSession.mockResolvedValue({ data: { session: {}, user: { id: 'player' } }, error: null } as never);
  auth.getUser.mockResolvedValue({ data: { user: { id: 'player' } }, error: null } as never);
  auth.updateUser.mockResolvedValue({ data: { user: { id: 'player' } }, error: null } as never);
  auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null } as never);
});

afterEach(() => jest.useRealTimers());

it('verifies a link, removes its fragment, saves a matching password and continues', async () => {
  const view = await withTheme(<ResetPasswordScreen />);
  await waitFor(() => expect(screen.getByLabelText('New password')).toBeTruthy());
  expect(router.setParams).toHaveBeenCalledWith({ '#': '' });
  // Simulate the router clearing the fragment without losing the verified form.
  jest.mocked(useLocalSearchParams).mockReturnValue({ '#': '' });
  await view.rerender(<ThemeProvider><ResetPasswordScreen /></ThemeProvider>);
  expect(auth.setSession).toHaveBeenCalledTimes(1);
  await enterPassword();
  await fireEvent.press(screen.getByRole('button', { name: 'Save new password' }));
  await waitFor(() => expect(screen.getByText('Password updated.')).toBeTruthy());
  expect(auth.updateUser).toHaveBeenCalledWith({ password: 'NewCricket123!' });
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(router.replace).toHaveBeenCalledWith('/home');
});

it('does not save mismatching passwords', async () => {
  await withTheme(<ResetPasswordScreen />);
  await waitFor(() => expect(screen.getByLabelText('New password')).toBeTruthy());
  await enterPassword();
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'AnotherPassword!');
  await fireEvent.press(screen.getByRole('button', { name: 'Save new password' }));
  expect(screen.getByText('Passwords don’t match.')).toBeTruthy();
  expect(auth.updateUser).not.toHaveBeenCalled();
});

it.each([undefined, 'error=access_denied&error_code=otp_expired', 'type=signup']) (
  'offers a fresh request for a missing or invalid recovery link', async (value) => {
    jest.mocked(useLocalSearchParams).mockReturnValue(value ? { '#': value } : {});
    await withTheme(<ResetPasswordScreen />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Request a new link' })).toBeTruthy());
    expect(screen.queryByLabelText('New password')).toBeNull();
    expect(auth.updateUser).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Request a new link' }));
    expect(router.replace).toHaveBeenCalledWith('/forgot-password');
  },
);

it('retries failed verification even after the router clears the fragment', async () => {
  auth.setSession.mockRejectedValueOnce(new Error('offline'));
  const view = await withTheme(<ResetPasswordScreen />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy());
  jest.mocked(useLocalSearchParams).mockReturnValue({ '#': '' });
  await view.rerender(<ThemeProvider><ResetPasswordScreen /></ThemeProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.getByLabelText('New password')).toBeTruthy());
  expect(auth.setSession).toHaveBeenCalledTimes(2);
});

it('prevents duplicate saves, then allows retry after a network failure', async () => {
  let rejectUpdate!: (reason: Error) => void;
  auth.updateUser.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectUpdate = reject; }));
  await withTheme(<ResetPasswordScreen />);
  await waitFor(() => expect(screen.getByLabelText('New password')).toBeTruthy());
  await enterPassword();
  const submit = screen.getByLabelText('Confirm new password').props.onSubmitEditing as () => Promise<void>;
  await act(async () => {
    const first = submit();
    const second = submit();
    await Promise.resolve();
    await Promise.resolve();
    expect(auth.updateUser).toHaveBeenCalledTimes(1);
    rejectUpdate(new Error('offline'));
    await Promise.all([first, second]);
  });
  expect(screen.getByText('Couldn’t connect. Check your connection and try again.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save new password' }));
  await waitFor(() => expect(screen.getByText('Password updated.')).toBeTruthy());
});

it('reports expiry during saving and offers another email', async () => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } } as never);
  await withTheme(<ResetPasswordScreen />);
  await waitFor(() => expect(screen.getByLabelText('New password')).toBeTruthy());
  await enterPassword();
  await fireEvent.press(screen.getByRole('button', { name: 'Save new password' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Request a new link' })).toBeTruthy());
  expect(auth.updateUser).not.toHaveBeenCalled();
});

it('requests a reset, prevents duplicates, supports resending and correcting the email', async () => {
  jest.useFakeTimers();
  await withTheme(<ForgotPasswordScreen />);
  await fireEvent.changeText(screen.getByLabelText('Email'), ' player@example.com ');
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('player@example.com', { redirectTo: 'essports://reset-password' });
  expect(screen.getByText('Check your email.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Resend link in 60s' })).toBeDisabled();
  await act(() => jest.advanceTimersByTime(60_000));
  await fireEvent.press(screen.getByRole('button', { name: 'Resend reset link' }));
  expect(auth.resetPasswordForEmail).toHaveBeenCalledTimes(2);
  await fireEvent.press(screen.getByRole('button', { name: 'Use another email' }));
  expect(screen.getByLabelText('Email')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send again in 60s' })).toBeDisabled();
});

it('does not claim email delivery after a network error and allows retry', async () => {
  auth.resetPasswordForEmail.mockRejectedValueOnce(new Error('offline'));
  await withTheme(<ForgotPasswordScreen />);
  await fireEvent.changeText(screen.getByLabelText('Email'), 'player@example.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
  expect(screen.queryByText('Check your email.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
  expect(screen.getByText('Check your email.')).toBeTruthy();
});
