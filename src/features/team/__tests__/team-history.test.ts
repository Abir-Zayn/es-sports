import { toHistory, type HistoryRow } from '../data/team-history';

const side = (id: string, name: string) => ({ id, name, short_name: name.slice(0, 3).toUpperCase(), tone: 'blue', logo_url: null });
const played = (over: Partial<NonNullable<HistoryRow['match']>>): NonNullable<HistoryRow['match']> => ({
  id: 'm', status: 'completed', team_a_name: 'Sylhet Empire', team_b_name: 'Rajshahi Lions', winner_side: 'a', result_summary: 'Sylhet Empire won',
  team_a_runs: 29, team_a_wickets: 0, team_a_balls: 8, team_b_runs: 28, team_b_wickets: 5, team_b_balls: 21, overs_limit: 4, completed_at: null, ...over,
});
const row = (number: number, home: boolean, match: HistoryRow['match'], stage = 'League'): HistoryRow => ({
  number, stage, match_date: '2026-11-25', home_team_id: home ? 'se' : 'rl', away_team_id: home ? 'rl' : 'se',
  tournaments: { name: 'Bangladesh Premiere League' }, home: home ? side('se', 'Sylhet Empire') : side('rl', 'Rajshahi Lions'),
  away: home ? side('rl', 'Rajshahi Lions') : side('se', 'Sylhet Empire'), match,
});

it('reads the result from this team\'s side, puts its score first, and labels the match', () => {
  const { matches } = toHistory('se', 'Sylhet Empire', [row(7, true, played({ id: 'sf' }), 'Semi-final')]);
  expect(matches[0]).toMatchObject({
    id: 'sf', result: 'W', label: 'MATCH 7 · SEMI-FINAL · BANGLADESH PREMIERE LEAGUE · 25 NOV',
    opponent: { name: 'Rajshahi Lions', short: 'RAJ' }, scores: '29/0 (1.2) · 28/5 (3.3)', outcome: 'Sylhet Empire won',
  });
});

it('finds the team on side b by name even when the fixture listed it away, and counts the record', () => {
  const rows = [
    row(4, false, played({ id: 'l', team_a_name: 'Rajshahi Lions', team_b_name: 'Sylhet Empire', winner_side: 'a' })),
    row(3, true, played({ id: 't', winner_side: null, result_summary: 'Match tied' })),
    row(2, true, played({ id: 'live', status: 'live', winner_side: null })),
    row(1, true, played({ id: 'up', status: 'scheduled' })),
  ];
  const { matches, record } = toHistory('se', 'Sylhet Empire', rows);
  expect(matches.map((m) => [m.id, m.result])).toEqual([['l', 'L'], ['t', 'T'], ['live', 'live']]);
  expect(matches.find((m) => m.id === 'live')?.outcome).toBe('In progress');
  expect(record).toEqual({ played: 2, won: 0, lost: 1, position: 0 });
});
