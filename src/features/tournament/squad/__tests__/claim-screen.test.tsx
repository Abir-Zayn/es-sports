import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { resetRosters } from '../../roster/roster-repository';
import { ClaimScreen } from '../claim-screen';

let mockToken = 'claim-hsf-p2';
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ token: mockToken }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'u-liton' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Liton Roy' } }) }));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ClaimScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('claiming a guest profile', () => {
  beforeEach(() => {
    resetRosters();
    mockToken = 'claim-hsf-p2';
  });

  it('shows the guest profile and claims it', async () => {
    await show();
    expect(await screen.findByText('Bowler for Halishahar Strikers in HSF Premier League 2026')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'This is me, claim it' }));
    expect(await screen.findByText('Profile claimed. Matches for Halishahar Strikers now count on your career.')).toBeTruthy();
  });

  it('explains an unknown link', async () => {
    mockToken = 'nope';
    await show();
    expect(await screen.findByText('This link is no longer valid. Ask your team owner to send a new one.')).toBeTruthy();
  });
});
