import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import type { ScheduledMatch } from '../schedule-builder/types';
import { StartMatchSheet } from './start-match-sheet';

const mockPush = jest.fn();
const mockStart = jest.fn();
const mockFetchSquad = jest.fn();
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
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
