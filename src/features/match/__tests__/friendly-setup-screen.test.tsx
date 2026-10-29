import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

import { clearStagedSetups, stagedSetup } from '@/features/scoring/data/staged-setups';
import { ThemeProvider } from '@/theme';

import { FriendlySetupScreen } from '../friendly-setup-screen';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace, canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser Me' } }) }));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <FriendlySetupScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

async function quickAdd(team: 'Team A' | 'Team B', name: string) {
  await fireEvent.press(screen.getByRole('button', { name: `Quick add to ${team}` }));
  await fireEvent.changeText(screen.getByLabelText('Player name'), name);
  await fireEvent.press(screen.getByRole('button', { name: 'Add to squad' }));
}

/** Four a side, both teams named and full. */
async function fillForm() {
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.changeText(screen.getByLabelText('Team A name'), 'Karnaphuli Kings');
  await fireEvent.changeText(screen.getByLabelText('Team B name'), 'Chattogram Strikers');
  await fireEvent.press(screen.getByRole('button', { name: 'Add me to Team A' }));
  for (const name of ['Rafi Hasan', 'Imran Kayes', 'Sumon Das']) await quickAdd('Team A', name);
  for (const name of ['Liton Roy', 'Nayeem Islam', 'Tanvir Ahmed', 'Arif Khan']) await quickAdd('Team B', name);
}

describe('friendly match setup', () => {
  beforeEach(() => {
    clearStagedSetups();
    mockReplace.mockReset();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('explains what is missing instead of opening the toss', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    expect(screen.getByText('Fix the highlighted parts to go to the toss.')).toBeTruthy();
    expect(screen.getAllByText('Give the team a name of 2 to 30 characters.')).toHaveLength(2);
    expect(screen.queryByText('Flip coin')).toBeNull();
  });

  it('builds two squads, benches the extra player, and keeps the side at its size', async () => {
    await show();
    await fillForm();
    expect(screen.getByText('Organiser Me')).toBeTruthy();
    expect(screen.getAllByText('4/4 playing · 4/16 in squad')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Add me to Team B' })).toBeNull();
    await quickAdd('Team B', 'Reserve Player');
    expect(screen.getByText('4/4 playing · 5/16 in squad')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Reserve Player playing', checked: false })).toBeTruthy();
    await fireEvent.press(screen.getByRole('switch', { name: 'Reserve Player playing' }));
    expect(screen.getByText('4 are already playing. Bench someone first.')).toBeTruthy();
  });

  it('tosses, lets the winner choose, and hands the match to the scorer', async () => {
    await show();
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    await fireEvent.press(screen.getByRole('button', { name: 'Flip coin' }));
    expect(await screen.findByText('Karnaphuli Kings won the toss!')).toBeTruthy();
    expect(screen.getByText('Karnaphuli Kings called heads; it landed heads.')).toBeTruthy();
    jest.mocked(Math.random).mockRestore();
    expect(screen.getByRole('button', { name: 'Start scoring' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Bowl first' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Start scoring' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    const { params } = mockReplace.mock.calls[0][0] as { params: { id: string } };
    expect(params.id).toMatch(/^friendly-/);
    const staged = stagedSetup(params.id)?.setup;
    expect(staged).toMatchObject({ preset: true, playersPerSide: 4, oversLimit: 6, tossWinner: 'KK', decision: 'bowl' });
    expect(staged?.teams.KK.players.find((p) => p.name === 'Organiser Me')?.profileId).toBe('me');
    expect(staged?.teams.CS.team.name).toBe('Chattogram Strikers');
  });
});
