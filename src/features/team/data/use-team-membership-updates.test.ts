import { keysFor } from './use-team-membership-updates';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

describe('keysFor', () => {
  it('refreshes the team, everyone’s teams and all squads when a member leaves', () => {
    expect(keysFor('team_members', { team_id: 't1' })).toEqual([
      ['my-teams'], ['team-members', 't1'], ['team', 't1'], ['tournament-squad'], ['tournament-roster'],
    ]);
  });

  it('refreshes only that tournament when a squad row changes', () => {
    expect(keysFor('tournament_squads', { tournament_id: 'x', team_id: 't1' })).toEqual([['tournament-squad', 'x'], ['tournament-roster', 'x']]);
    expect(keysFor('tournament_squads', {})).toEqual([['tournament-squad'], ['tournament-roster']]);
  });
});
