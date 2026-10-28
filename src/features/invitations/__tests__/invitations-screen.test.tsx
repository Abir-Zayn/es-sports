import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { InvitationsScreen } from '../invitations-screen';
import { resetInvitations } from '../invitations-repository';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <InvitationsScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('invitations', () => {
  beforeEach(resetInvitations);

  it('lists team owner and moderator invites with who sent them', async () => {
    await show();
    expect(await screen.findByText('Own Bayazid Blasters in HSF Premier League 2026')).toBeTruthy();
    expect(screen.getByText('Moderate Port City Winter Cup')).toBeTruthy();
    expect(screen.getByText('From Arif Chowdhury · 2h ago')).toBeTruthy();
  });

  it('accepts one and declines the other, hiding their buttons once answered', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Accept: Own Bayazid Blasters in HSF Premier League 2026' }));
    expect(await screen.findByText('Accepted')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Decline: Moderate Port City Winter Cup' }));
    expect(await screen.findByText('Declined')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Accept:/ })).toBeNull();
  });
});
