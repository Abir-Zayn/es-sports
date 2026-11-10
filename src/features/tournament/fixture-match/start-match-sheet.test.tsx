import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import type { ScheduledMatch } from '../schedule-builder/types';
import { StartMatchSheet } from './start-match-sheet';

const mockPush = jest.fn();
const mockStart = jest.fn();
const mockFetchSquad = jest.fn();
const mockStaff = jest.fn();
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: ReactNode }) => children }));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('../squad/server/squad-server', () => ({
  fetchServerSquad: (...args: unknown[]) => mockFetchSquad(...args), serverSquadKey: (t: string, team: string) => ['squad', t, team],
}));
jest.mock('../data/tournament-repository', () => ({
  ...jest.requireActual('../data/tournament-repository'), fetchTournamentStaff: (...args: unknown[]) => mockStaff(...args),
}));
jest.mock('./start-fixture', () => ({ startFixtureMatch: (...args: unknown[]) => mockStart(...args) }));

const team = (id: string) => ({ kind: 'team' as const, team: { id, name: id, short: id } });
const match: ScheduledMatch = { id: 'fixture', number: 1, round: 0, stage: 'League', date: '2026-11-03', startMin: 540, home: team('A'), away: team('B') };

const person = (id: string, name: string) => ({ id, name, area: null, avatarUrl: null });
const moderator = (id: string, canScore: boolean) => ({ user: person(id, `Moderator ${id}`), role: 'moderator' as const, canStream: true, canScore });
const owner = { user: person('me', 'Owner'), role: 'owner' as const, canStream: false, canScore: false };

async function open() {
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
  return close;
}

async function pickBothXis() {
  await fireEvent.press(await screen.findByRole('button', { name: 'A: 0/1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add A Player' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'B: 0/1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add B Player' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
}

beforeEach(() => jest.clearAllMocks());

test('the only scoring moderator scores, and the owner who started it just watches', async () => {
  mockStaff.mockResolvedValue([owner, moderator('mod', true)]);
  const close = await open();
  expect(await screen.findByRole('button', { name: 'Scorer: Moderator mod' })).toBeTruthy();
  await pickBothXis();
  await fireEvent.press(screen.getByRole('button', { name: 'Start match' }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/match/[id]', params: { id: 'match-id' } }));
  expect(mockStart).toHaveBeenCalledWith('fixture', 'mod', ['A-player'], ['B-player']);
  expect(close).toHaveBeenCalled();
});

test('opens scoring when the person starting the match is the scoring moderator', async () => {
  mockStaff.mockResolvedValue([owner, { ...moderator('me', true), role: 'moderator' as const }]);
  await open();
  await screen.findByRole('button', { name: 'Scorer: Moderator me' });
  await pickBothXis();
  await fireEvent.press(screen.getByRole('button', { name: 'Start match' }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/scorer/[id]', params: { id: 'match-id' } }));
});

test('lets the owner choose between two moderators who can both score', async () => {
  mockStaff.mockResolvedValue([owner, moderator('m1', true), moderator('m2', true)]);
  await open();
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose the scorer' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Moderator m2' }));
  await pickBothXis();
  await fireEvent.press(screen.getByRole('button', { name: 'Start match' }));
  await waitFor(() => expect(mockStart).toHaveBeenCalledWith('fixture', 'm2', ['A-player'], ['B-player']));
});

test('says a moderator is needed when nobody has the scoring duty', async () => {
  mockStaff.mockResolvedValue([owner]);
  await open();
  expect(await screen.findByText(/Add a moderator with the scoring duty first/)).toBeTruthy();
  await pickBothXis();
  expect(screen.getByRole('button', { name: 'Start match' }).props.accessibilityState?.disabled ?? true).toBeTruthy();
});
