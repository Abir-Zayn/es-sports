import { initialSetup } from '../../sample-data';
import { buildMatchRows, setupFromRows } from '../match-rows';
import type { MatchRow } from '../types';

const ID = '22222222-2222-4222-8222-222222222222';

describe('match rows', () => {
  it('stores both squads and marks the playing XI', () => {
    const { match, players } = buildMatchRows(ID, 'm12', initialSetup, new Date('2026-10-29T10:00:00Z'));
    expect(match).toMatchObject({
      id: ID, fixture_ref: 'm12', status: 'live', overs_limit: 20, toss_winner_side: 'a', toss_decision: 'bat',
      started_at: '2026-10-29T10:00:00.000Z',
    });
    for (const side of ['a', 'b']) {
      expect(players.filter((p) => p.side === side && p.in_playing_xi)).toHaveLength(11);
    }
    expect(new Set(players.map((p) => p.key)).size).toBe(players.length);
  });

  it('reads the setup back from stored rows', () => {
    const setup = { ...initialSetup, tossWinner: 'CS' as const, decision: 'bowl' as const, recordShots: false, oversLimit: 10 };
    const { match, players } = buildMatchRows(ID, 'm12', setup, new Date());
    const row: MatchRow = { ...match, tournament_id: null, created_by: 'user', completed_at: null, result_type: null };
    expect(setupFromRows(row, players)).toMatchObject({
      tossWinner: 'CS', decision: 'bowl', recordShots: false, oversLimit: 10, playingXi: setup.playingXi,
    });
  });
});
