import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../../__fixtures__/supabase-fake';
import { RealTournamentMatches } from '../../real/real-tournament-matches';
import { cancelPublishedMatch, fetchSchedule, movePublishedMatch, publishSchedule } from '../schedule-repository';
import { schedulePayload } from '../schedule-server';
import type { ScheduledMatch } from '../types';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../../__fixtures__/supabase-fake').fake }));
const mockOpenMatch = jest.fn();
jest.mock('@/features/match/use-match-routes', () => ({ useOpenMatch: () => mockOpenMatch }));

const T = 'f5c00000-0000-4000-8000-000000000001';
const alpha = { id: 'a', name: 'Alpha', short_name: 'ALP' };
const bravo = { id: 'b', name: 'Bravo', short_name: 'BRV' };
const row = (id: string, number: number, extra: object = {}) => ({
  id, number, stage: 'League', round: 0, home_label: null, away_label: null, match_date: '2999-11-10', start_min: 540 + (number - 1) * 240,
  status: 'scheduled', cancel_reason: null, match_id: null, home: alpha, away: bravo, ...extra,
});

function seed(published = true) {
  fake.results.tournaments = {
    data: { schedule_mode: 'manual', slots_per_day: 3, first_start_min: 600, schedule_published_at: published ? '2999-11-01T00:00:00Z' : null },
    error: null,
  };
  fake.results.tournament_fixtures = {
    data: [row('f1', 1), row('f2', 2, { status: 'cancelled', cancel_reason: 'Rain' }),
      row('f3', 3, { stage: 'Final', round: 1, home: null, away: null, home_label: 'Winner of Match 1', away_label: 'Winner of Match 2', match_date: '2999-11-11' })],
    error: null,
  };
}

beforeEach(() => { fake.reset(); mockOpenMatch.mockClear(); seed(); });

describe('the schedule of a published tournament', () => {
  it('maps fixtures, placeholders and cancellations', async () => {
    const schedule = await fetchSchedule(T);
    expect(schedule).toMatchObject({ mode: 'manual', settings: { perDay: 3, firstStartMin: 600 } });
    const [one, two, final] = schedule?.matches ?? [];
    expect(one).toMatchObject({ id: 'f1', home: { kind: 'team', team: { name: 'Alpha', short: 'ALP' } }, started: false });
    expect(one.cancelled).toBeUndefined();
    expect(two.cancelled).toEqual({ reason: 'Rain' });
    expect(final).toMatchObject({ stage: 'Final', home: { kind: 'tbd', label: 'Winner of Match 1' } });
  });

  it('is null until the owner publishes', async () => {
    seed(false);
    expect(await fetchSchedule(T)).toBeNull();
  });

  it('sends teams by id and placeholders by label, leaving cancelled matches out', () => {
    const match = (number: number, extra: Partial<ScheduledMatch> = {}): ScheduledMatch => ({
      id: `m${number}`, number, stage: 'League', round: 0, date: '2999-11-10', startMin: 540,
      home: { kind: 'team', team: { id: 'a', name: 'Alpha', short: 'ALP' } }, away: { kind: 'tbd', label: '1st in league' }, ...extra,
    });
    const payload = schedulePayload('auto', { perDay: 2, firstStartMin: 540 }, [match(1), match(2, { cancelled: { reason: 'x' } })]);
    expect(payload).toEqual({
      mode: 'auto', per_day: 2, first_start_min: 540,
      matches: [{ number: 1, stage: 'League', round: 0, match_date: '2999-11-10', start_min: 540, home_team: 'a', away_label: '1st in league' }],
    });
  });

  it('publishes, moves and cancels through the server', async () => {
    const schedule = await fetchSchedule(T);
    await publishSchedule(T, true, 'manual', schedule!.settings, schedule!.matches);
    expect(fake.rpc).toHaveBeenCalledWith('publish_tournament_schedule', expect.objectContaining({ p_tournament: T }));
    await movePublishedMatch(T, 'f1', '2999-11-12', 600);
    expect(fake.rpc).toHaveBeenCalledWith('reschedule_tournament_fixture', { p_fixture: 'f1', p_date: '2999-11-12', p_start_min: 600 });
    await cancelPublishedMatch(T, 'f1', '  Ground flooded ');
    expect(fake.rpc).toHaveBeenCalledWith('cancel_tournament_fixture', { p_fixture: 'f1', p_reason: 'Ground flooded' });
  });

  it('explains a clash and a started match in plain words', async () => {
    fake.rpcResult = { data: null, error: { code: 'ET006', message: 'raw' } };
    await expect(movePublishedMatch(T, 'f1', '2999-11-12', 600)).rejects.toThrow('does not fit the schedule');
    fake.rpcResult = { data: null, error: { code: 'ET004', message: 'raw' } };
    await expect(cancelPublishedMatch(T, 'f1', 'Rain')).rejects.toThrow('has started');
  });
});

describe('the matches tab of a published tournament', () => {
  const tournament = {
    id: T, ownerId: 'o', name: 'Port City Cup', city: 'Ctg', venue: 'Main Ground', startDate: '2999-11-10', endDate: '2999-11-12',
    matchFormat: 'T20', competition: 'league', teamsPlanned: 4, ball: 'Tennis', sideFormat: 'gully_6', playersPerSide: 6,
    minSquad: 8, maxSquad: 10, registrationOpens: '', registrationDeadline: '', profileUrl: null,
  };
  async function show(canSchedule: boolean) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    await render(<ThemeProvider><QueryClientProvider client={client}><RealTournamentMatches tournament={tournament} canSchedule={canSchedule} onSchedule={jest.fn()} /></QueryClientProvider></ThemeProvider>);
  }

  it('lists the published matches and marks the cancelled one', async () => {
    await show(false);
    expect(await screen.findByRole('button', { name: /^Match 1,/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cancelled: Rain/ })).toBeTruthy();
    expect(screen.getByText('Cancelled')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Change schedule' })).toBeNull();
  });

  it('opens the linked match using its match id and leaves an unstarted fixture closed', async () => {
    fake.results.tournament_fixtures.data = [row('f1', 1, { match_id: 'match-id', match: {
      id: 'match-id', status: 'completed', team_a_runs: 50, team_a_wickets: 1, team_a_balls: 36,
      team_b_runs: 40, team_b_wickets: 3, team_b_balls: 36, overs_limit: 20,
      winner_side: 'a', result_summary: 'Alpha won by 10 runs', completed_at: '2999-11-10T12:00:00Z',
    } }), row('f2', 2)];
    await show(false);
    await fireEvent.press(await screen.findByRole('button', { name: /Alpha won by 10 runs/ }));
    expect(mockOpenMatch).toHaveBeenCalledWith('match-id', 'result');
    await fireEvent.press(screen.getByRole('button', { name: /^Match 2,/ }));
    expect(mockOpenMatch).toHaveBeenCalledTimes(1);
  });

  it('tells the owner to create a schedule when none is published', async () => {
    seed(false);
    await show(true);
    expect(await screen.findByText('The schedule is not published yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create schedule' })).toBeTruthy();
  });
});
