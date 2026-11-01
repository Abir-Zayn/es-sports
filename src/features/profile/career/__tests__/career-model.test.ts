import { buildCareer, distinctTeams, mergeTeams, type FigureRow, type PlayedRow } from '../career-model';

const figure = (over: Partial<FigureRow> & { match_id: string }): FigureRow => ({
  key: 'p1', completed_at: '2026-10-20T10:00:00Z', batted: true, runs: 0, balls_faced: 0, fours: 0, sixes: 0, not_out: false,
  balls_bowled: 0, runs_conceded: 0, wickets: 0, ...over,
});

const played = (over: Partial<PlayedRow> & { match_id: string }): PlayedRow => ({
  side: 'a', completed_at: '2026-10-20T10:00:00Z', winner_side: 'a',
  own: { name: 'Strikers', short: 'STR', tone: 'blue' }, other: { name: 'Titans', short: 'TIT', tone: 'yellow' }, ...over,
});

describe('buildCareer', () => {
  it('is empty for a player with no finished match', () => {
    const career = buildCareer([], []);
    expect(career.batting.matches).toBe(0);
    expect(career.batting.runs).toBe(0);
    expect(career.bowling.wickets).toBe(0);
    expect(career.recent).toEqual([]);
    expect(career.teams).toEqual([]);
  });

  it('adds up matches, runs and wickets across finished matches', () => {
    const career = buildCareer(
      [figure({ match_id: 'm1', runs: 45, balls_faced: 30, fours: 4, not_out: true }),
        figure({ match_id: 'm2', runs: 12, balls_faced: 10, balls_bowled: 24, runs_conceded: 20, wickets: 3 })],
      [played({ match_id: 'm1' }), played({ match_id: 'm2' })],
    );
    expect(career.batting).toMatchObject({ matches: 2, innings: 2, runs: 57, highest: '45*' });
    expect(career.bowling).toMatchObject({ matches: 2, wickets: 3, overs: '4.0', best: '3/20' });
  });

  it('does not count an innings for a player who never batted', () => {
    const career = buildCareer([figure({ match_id: 'm1', batted: false, balls_bowled: 6, runs_conceded: 4, wickets: 1 })], []);
    expect(career.batting).toMatchObject({ matches: 1, innings: 0, runs: 0 });
  });

  it('lists the last five matches newest first with the opponent, the figures and the result', () => {
    const ids = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
    const figures = ids.map((id, i) => figure({ match_id: id, completed_at: `2026-10-0${i + 1}T10:00:00Z`, runs: i, balls_faced: 5 }));
    const career = buildCareer(figures, [
      ...ids.map((id) => played({ match_id: id })),
    ]);
    expect(career.recent.map((item) => item.id)).toEqual(['m6', 'm5', 'm4', 'm3', 'm2']);
    expect(career.recent[0]).toMatchObject({ opponent: 'vs Titans', bat: '5 (5)', won: true });
    expect(career.recent[0]?.bowl).toBeUndefined();
  });

  it('shows bowling figures and a loss when the other side won', () => {
    const career = buildCareer(
      [figure({ match_id: 'm1', batted: false, balls_bowled: 14, runs_conceded: 22, wickets: 2 })],
      [played({ match_id: 'm1', side: 'b', winner_side: 'a', own: { name: 'Titans', short: 'TIT', tone: 'yellow' }, other: { name: 'Strikers', short: 'STR', tone: 'blue' } })],
    );
    expect(career.recent[0]).toMatchObject({ opponent: 'vs Strikers', bowl: '2/22 (2.2)', won: false });
    expect(career.recent[0]?.bat).toBeUndefined();
  });

  it('is not a win when the match has no winner', () => {
    const career = buildCareer([figure({ match_id: 'm1' })], [played({ match_id: 'm1', winner_side: null })]);
    expect(career.recent[0]?.won).toBe(false);
  });
});

describe('teams', () => {
  it('counts a team once however many matches it played, ignoring case', () => {
    const teams = distinctTeams([
      played({ match_id: 'm1' }),
      played({ match_id: 'm2', own: { name: ' strikers ', short: 'STR', tone: 'blue' } }),
      played({ match_id: 'm3', own: { name: 'Titans', short: 'TIT', tone: 'weird' } }),
    ]);
    expect(teams.map((team) => team.name)).toEqual(['Strikers', 'Titans']);
    expect(teams[1]?.tone).toBe('neutral');
  });

  it('merges played-for and member teams by name', () => {
    const merged = mergeTeams(
      [{ short: 'STR', name: 'Strikers', tone: 'blue' }],
      [{ short: 'STR', name: 'strikers', tone: 'blue' }, { short: 'LIO', name: 'Lions', tone: 'neutral' }],
    );
    expect(merged.map((team) => team.name)).toEqual(['Strikers', 'Lions']);
  });
});
