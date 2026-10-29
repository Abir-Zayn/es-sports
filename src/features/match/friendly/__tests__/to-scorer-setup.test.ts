import { normalizeOpeners } from '@/features/scoring/components/opening-players';
import { createInnings } from '@/features/scoring/engine/create-innings';
import { battingFirst } from '@/features/scoring/sample-data';

import { addPlayer, newFriendly, renameTeam, withPlayersPerSide } from '../friendly-rules';
import { toScorerSetup } from '../to-scorer-setup';
import { decideToss } from '../toss';

function tossed() {
  let setup = withPlayersPerSide(newFriendly('friendly-1', 'me', new Date()), 4);
  setup = renameTeam(renameTeam(setup, 'teamA', 'Karnaphuli Kings'), 'teamB', 'Strikers');
  for (let i = 0; i < 5; i++) setup = addPlayer(setup, 'teamA', { id: `a${i}`, name: `King ${i}`, role: 'Batter', userId: i === 0 ? 'u-king' : null });
  for (let i = 0; i < 4; i++) setup = addPlayer(setup, 'teamB', { id: `b${i}`, name: `Striker ${i}`, role: 'Bowler' });
  return { ...setup, assignedScorerId: 'u-king', toss: decideToss({ calledBy: 'teamA', call: 'heads', landed: 'tails' }, 'bat', new Date()) };
}

describe('friendly to scorer', () => {
  it('carries the teams, the playing sides and the toss into the scorer setup', () => {
    const setup = toScorerSetup(tossed(), 'me');
    expect(setup).toMatchObject({
      title: 'Friendly · Karnaphuli Kings vs Strikers', playersPerSide: 4, preset: true, oversLimit: 6,
      tossWinner: 'CS', decision: 'bat', scorerIds: ['u-king'],
      playingXi: { KK: ['a0', 'a1', 'a2', 'a3'], CS: ['b0', 'b1', 'b2', 'b3'] },
    });
    expect(setup.teams.KK.team).toEqual({ name: 'Karnaphuli Kings', short: 'KK', tone: 'blue' });
    expect(setup.teams.KK.players).toHaveLength(5);
    expect(setup.teams.KK.players[0].profileId).toBe('u-king');
  });

  it('gives the scorer a setup that starts an innings once openers are filled in', () => {
    const setup = toScorerSetup(tossed(), 'me');
    const score = createInnings(normalizeOpeners(setup, battingFirst(setup)));
    expect(score.battingTeam).toBe('CS');
    expect(Object.keys(score.batters)).toHaveLength(4);
    expect(score.teams.CS.name).toBe('Strikers');
  });

  it('needs a toss first', () => {
    expect(() => toScorerSetup({ ...tossed(), toss: null }, 'me')).toThrow('Toss the coin before scoring.');
  });
});
