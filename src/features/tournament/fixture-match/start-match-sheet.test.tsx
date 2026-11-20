import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import type { ScheduledMatch } from '../schedule-builder/types';
import { StartMatchSheet } from './start-match-sheet';

const mockPush = jest.fn();
const mockStart = jest.fn();
const mockFetchSquad = jest.fn();
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: ReactNode }) => children }));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('../squad/server/squad-server', () => ({
  fetchServerSquad: (...args: unknown[]) => mockFetchSquad(...args), serverSquadKey: (t: string, team: string) => ['squad', t, team],
}));
jest.mock('./start-fixture', () => ({ startFixtureMatch: (...args: unknown[]) => mockStart(...args) }));

const team = (id: string) => ({ kind: 'team' as const, team: { id, name: id, short: id } });
const match: ScheduledMatch = { id: 'fixture', number: 1, round: 0, stage: 'League', date: '2026-11-03', startMin: 540, home: team('A'), away: team('B') };

test('selects both XIs and opens scoring when the starter is the scorer', async () => {
  mockFetchSquad.mockImplementation(async (_t: string, teamId: string) => ({
    teamName: teamId, selectedIds: [`${teamId}-player`], candidates: [
      { profileId: `${teamId}-player`, name: `${teamId} Player`, avatarUrl: null, role: 'player', availability: 'available', takenBy: null },
    ],
  }));
  mockStart.mockResolvedValue('match-id');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  const close = jest.fn();
  await render(<ThemeProvider><QueryClientProvider client={client}>
    <StartMatchSheet tournamentId="t" match={match} playersPerSide={1} onClose={close} />
  </QueryClientProvider></ThemeProvider>);
  await fireEvent.press(await screen.findByRole('button', { name: 'A: 0/1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add A Player' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'B: 0/1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add B Player' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Start match' }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/scorer/[id]', params: { id: 'match-id' } }));
  expect(mockStart).toHaveBeenCalledWith('fixture', 'me', ['A-player'], ['B-player']);
  expect(close).toHaveBeenCalled();
});

test('"Select squad" picks the XI at random from a bigger squad, skipping unavailable players', async () => {
  mockFetchSquad.mockImplementation(async (_t: string, teamId: string) => {
    const players = Array.from({ length: 12 }, (_, i) => ({
      profileId: `${teamId}-${i + 1}`, name: `${teamId} ${i + 1}`, avatarUrl: null, role: 'player',
      availability: i === 0 ? 'injured' : 'available', takenBy: null,
    }));
    return { teamName: teamId, selectedIds: players.map((p) => p.profileId), candidates: players };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}>
    <StartMatchSheet tournamentId="t" match={match} playersPerSide={10} onClose={jest.fn()} />
  </QueryClientProvider></ThemeProvider>);
  await fireEvent.press(await screen.findByRole('button', { name: 'A: 0/10' }));
  // 11 of 12 are available, so 10 of the 11 are drawn; the injured player is never picked.
  const select = screen.getByRole('checkbox', { name: 'Select squad: picks 10 of 11 players at random' });
  await fireEvent.press(select);
  expect(screen.getByText('10/10 players selected')).toBeTruthy();
  expect(select.props.accessibilityState).toMatchObject({ checked: true });
  expect(screen.queryByRole('button', { name: 'Remove A 1' })).toBeNull();
  // Unticking clears the XI again.
  await fireEvent.press(select);
  expect(screen.getByText('0/10 players selected')).toBeTruthy();
});
