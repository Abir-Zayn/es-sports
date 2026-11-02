import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import type { ServerSquad } from '../squad/server/squad-server';
import type { ScheduledMatch } from '../schedule-builder/types';
import { canStartFixture, startFixtureMatch } from './start-fixture';
import { XiPickerSheet } from './xi-picker-sheet';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: React.ReactNode }) => children }));

const team = (id: string) => ({ kind: 'team' as const, team: { id, name: id, short: id } });
const fixture: ScheduledMatch = { id: 'fixture', number: 1, round: 0, stage: 'League', date: '2026-11-03', startMin: 540, home: team('A'), away: team('B') };

beforeEach(() => fake.reset());

test('start RPC sends both teams and scorer and exposes safe error text', async () => {
  await expect(startFixtureMatch('fixture', 'scorer', ['home'], ['away'])).resolves.toBe('id');
  expect(fake.rpc).toHaveBeenCalledWith('start_tournament_fixture', { p_fixture: 'fixture', p_scorer: 'scorer', p_home_xi: ['home'], p_away_xi: ['away'] });
  fake.rpcResult = { data: null, error: { code: 'ET007', message: 'internal' } };
  await expect(startFixtureMatch('fixture', 'scorer', [], [])).rejects.toThrow('Both teams must be known');
});

test('only staff may start an unstarted fixture with two real teams', () => {
  expect(canStartFixture(fixture, true)).toBe(true);
  expect(canStartFixture(fixture, false)).toBe(false);
  expect(canStartFixture({ ...fixture, started: true }, true)).toBe(false);
  expect(canStartFixture({ ...fixture, cancelled: { reason: 'Rain' } }, true)).toBe(false);
  expect(canStartFixture({ ...fixture, home: { kind: 'tbd', label: 'Winner' } }, true)).toBe(false);
});

test('XI picker shows registered players and disables unavailable and excess choices', async () => {
  const squad: ServerSquad = {
    tournamentName: 'Cup', teamName: 'Alpha', minSquad: 1, maxSquad: 4, registrationDeadline: '', myRole: null,
    selectedIds: ['one', 'two'], candidates: [
      { profileId: 'one', name: 'One', avatarUrl: null, role: 'player', availability: 'available', takenBy: null },
      { profileId: 'two', name: 'Two', avatarUrl: null, role: 'player', availability: 'injured', takenBy: null },
      { profileId: 'three', name: 'Three', avatarUrl: null, role: 'player', availability: 'available', takenBy: null },
    ],
  };
  const change = jest.fn();
  await render(<ThemeProvider><XiPickerSheet visible squad={squad} selected={[]} limit={1} onChange={change} onClose={jest.fn()} /></ThemeProvider>);
  expect(screen.queryByText('Three')).toBeNull();
  expect(screen.getByRole('button', { name: 'Add Two' }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Add One' }));
  expect(change).toHaveBeenCalledWith(['one']);
});
