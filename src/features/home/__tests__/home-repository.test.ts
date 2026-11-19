import { toFollowTournament, toLiveMatch, toUpcomingMatch, type LiveRow } from '../data/home-repository';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const base: LiveRow = {
  id: 'm1', title: null, toss_winner_side: 'b', toss_decision: 'bowl', overs_limit: 6,
  team_a_name: 'Kings', team_a_short: 'KK', team_a_tone: 'yellow', team_a_image_url: null, team_a_runs: null, team_a_wickets: null, team_a_balls: null,
  team_b_name: 'Riders', team_b_short: 'PR', team_b_tone: 'blue', team_b_image_url: null, team_b_runs: null, team_b_wickets: null, team_b_balls: null,
  tournaments: null,
};

describe('toLiveMatch', () => {
  it('reports the toss before a ball is bowled, with the side that bats first on top', () => {
    const match = toLiveMatch(base);
    expect(match.status).toBe('Riders won the toss and chose to bowl');
    expect(match.teams[0].name).toBe('Kings');
    expect(match.teams[1].score).toBe('Yet to bat');
    expect(match.label).toBe('FRIENDLY MATCH');
  });

  it('shows the chase once the second side is batting', () => {
    const match = toLiveMatch({ ...base, team_a_runs: 60, team_a_wickets: 3, team_a_balls: 36, team_b_runs: 51, team_b_wickets: 2, team_b_balls: 26, tournaments: { name: 'HSF League' } });
    expect(match.status).toBe('Riders need 10 runs from 10 balls');
    expect(match.teams[1].batting).toBe(true);
    expect(match.teams[1].overs).toBe('(4.2)');
    expect(match.label).toBe('HSF LEAGUE');
  });
});

describe('toUpcomingMatch', () => {
  it('falls back when the match has no date yet', () => {
    const fixture = toUpcomingMatch({ id: 'f1', scheduled_at: null, team_a_name: 'A', team_b_name: 'B', tournaments: null });
    expect(fixture.month).toBe('TBD');
    expect(fixture.away).toBe('vs B');
    expect(fixture.meta).toBe('');
  });
});

describe('toFollowTournament', () => {
  it('says when a tournament starts, or that it is running', () => {
    const row = { id: 't1', name: 'Port City Cup', city: 'CTG', start_date: '2026-12-02', end_date: '2026-12-20', overs: 10, teams_planned: 6, profile_url: null };
    expect(toFollowTournament(row, '2026-11-18').meta).toBe('6 teams · T10 · Starts 2 Dec');
    expect(toFollowTournament(row, '2026-12-05').meta).toBe('6 teams · T10 · In progress');
    expect(toFollowTournament(row, '2026-11-18').short).toBe('PCC');
  });
});
