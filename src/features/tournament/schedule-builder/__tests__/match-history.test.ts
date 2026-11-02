import { buildSchedule } from '../../schedule';
import { toFixture } from '../to-fixture';
import type { LinkedMatch, ScheduledMatch } from '../types';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const base: ScheduledMatch = {
  id: 'fixture', number: 3, stage: 'Semi-final', round: 1, date: '2026-11-03', startMin: 540,
  home: { kind: 'team', team: { id: 'a', name: 'Alpha', short: 'ALP' } },
  away: { kind: 'team', team: { id: 'b', name: 'Bravo', short: 'BRV' } },
};
const linked: LinkedMatch = {
  id: 'match', status: 'live', team_a_runs: 123, team_a_wickets: 4, team_a_balls: 93,
  team_b_runs: 90, team_b_wickets: 5, team_b_balls: 72, overs_limit: 20,
  winner_side: 'a', result_summary: 'Alpha won by 33 runs', completed_at: '2026-11-03T12:00:00Z',
};

test('maps scheduled, live and completed linked matches', () => {
  expect(toFixture(base, 'Ground')).toMatchObject({ id: 'fixture', state: 'upcoming', note: 'Ground' });
  expect(toFixture({ ...base, match: linked }, 'Ground')).toMatchObject({
    state: 'live', sides: [{ score: '123/4', overs: '15.3' }, { score: '90/5', overs: '12' }],
  });
  expect(toFixture({ ...base, match: { ...linked, status: 'completed' } }, 'Ground')).toMatchObject({
    state: 'result', note: 'Alpha won by 33 runs', sides: [{ emphasised: true }, { emphasised: false }],
  });
});

test('orders results newest first', () => {
  const completed = { ...linked, status: 'completed' };
  const older = toFixture({ ...base, id: 'older', date: '2026-11-01', match: { ...completed, completed_at: '2026-11-01T12:00:00Z' } }, 'Ground');
  const newer = toFixture({ ...base, id: 'newer', date: '2026-11-03', match: completed }, 'Ground');
  expect(buildSchedule([older, newer], 'result')[0].slices[0].fixtures.map((f) => f.id)).toEqual(['newer', 'older']);
});
