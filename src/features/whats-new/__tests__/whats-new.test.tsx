import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState, type ReactNode } from 'react';

import WhatsNewRoute from '@/app/whats-new';
import { ThemeProvider } from '@/theme';

import { AutoOpenWhatsNew } from '../auto-open-whats-new';
import { fetchReleaseNotes } from '../release-notes';

const UPDATE_ID = '7d757a34-6c0f-452b-9129-567ea6172752';
const STORAGE_KEY = `whats-new.seen.${UPDATE_ID}`;
const NOTES = {
  title: 'Faster score updates',
  published_at: '2026-11-19T12:00:00Z',
  highlights: [{ title: 'Live matches', description: 'Scores refresh sooner.' }],
};

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  usePathname: jest.fn(),
}));
jest.mock('expo-updates', () => ({
  isEnabled: true,
  isEmbeddedLaunch: false,
  isEmergencyLaunch: false,
  updateId: '7d757a34-6c0f-452b-9129-567ea6172752',
}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('../release-notes', () => ({ fetchReleaseNotes: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));

function Wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retryDelay: 0, gcTime: Infinity } } }));
  return <QueryClientProvider client={client}><ThemeProvider>{children}</ThemeProvider></QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  focusManager.setFocused(true);
  jest.mocked(usePathname).mockReturnValue('/home');
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
  jest.mocked(fetchReleaseNotes).mockResolvedValue(NOTES);
});

it('opens the route when the installed OTA has notes the device has not seen', async () => {
  await render(<AutoOpenWhatsNew />, { wrapper: Wrapper });
  await waitFor(() => expect(router.navigate).toHaveBeenCalledWith('/whats-new'));
  expect(fetchReleaseNotes).toHaveBeenCalledWith(UPDATE_ID, expect.anything());
  expect(router.navigate).toHaveBeenCalledTimes(1);
});

it('skips the lookup when the update has already been shown', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('1');
  await render(<AutoOpenWhatsNew />, { wrapper: Wrapper });
  expect(SecureStore.getItemAsync).toHaveBeenCalledWith(STORAGE_KEY);
  expect(fetchReleaseNotes).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
});

it('leaves the user in their current screen and waits for Home', async () => {
  jest.mocked(usePathname).mockReturnValue('/scorer/match');
  const view = await render(<AutoOpenWhatsNew />, { wrapper: Wrapper });
  expect(router.navigate).not.toHaveBeenCalled();
  jest.mocked(usePathname).mockReturnValue('/home');
  await view.rerender(<AutoOpenWhatsNew />);
  await waitFor(() => expect(router.navigate).toHaveBeenCalledTimes(1));
});

it('leaves an update with no release notes unread', async () => {
  jest.mocked(fetchReleaseNotes).mockResolvedValue(null);
  await render(<AutoOpenWhatsNew />, { wrapper: Wrapper });
  await waitFor(() => expect(fetchReleaseNotes).toHaveBeenCalledTimes(1));
  expect(router.navigate).not.toHaveBeenCalled();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it('shows notes from the menu even when already seen and dismisses back to the caller', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('1');
  await render(<WhatsNewRoute />, { wrapper: Wrapper });
  expect(await screen.findByText('Scores refresh sooner.')).toBeTruthy();
  expect(screen.getByText('Faster score updates')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Got it' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

it('records the installed update as seen when its notes appear', async () => {
  await render(<WhatsNewRoute />, { wrapper: Wrapper });
  expect(await screen.findByText('Live matches')).toBeTruthy();
  await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledWith(STORAGE_KEY, '1'));
});

it('does not reopen after a manual view races the startup storage read', async () => {
  let resolveRead!: (value: string | null) => void;
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
  jest.mocked(usePathname).mockReturnValue('/whats-new');
  const view = await render(<><AutoOpenWhatsNew /><WhatsNewRoute /></>, { wrapper: Wrapper });
  await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledWith(STORAGE_KEY, '1'));
  await act(async () => resolveRead(null));
  jest.mocked(usePathname).mockReturnValue('/home');
  await view.rerender(<AutoOpenWhatsNew />);
  expect(router.navigate).not.toHaveBeenCalled();
});

it('offers a retry when the manual request fails', async () => {
  jest.mocked(fetchReleaseNotes).mockRejectedValue(new Error('Unavailable'));
  await render(<WhatsNewRoute />, { wrapper: Wrapper });
  const retry = await screen.findByRole('button', { name: 'Try again' });
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  jest.mocked(fetchReleaseNotes).mockResolvedValue(NOTES);
  await fireEvent.press(retry);
  expect(await screen.findByText('Live matches')).toBeTruthy();
});
