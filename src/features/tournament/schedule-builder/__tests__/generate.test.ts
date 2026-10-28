import { generatePairings, pairingProblem, roundRobin } from '../generate';
import type { Pairing, ScheduleTeam } from '../types';

const teams = (n: number): ScheduleTeam[] => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}`, short: `T${i + 1}` }));
const label = (p: Pairing) => [p.home, p.away].map((s) => (s.kind === 'team' ? s.team.id : s.label)).join(' v ');

describe('round robin', () => {
  it.each([4, 5, 6, 8])('pairs every team with every other exactly once (%i teams)', (n) => {
    const rounds = roundRobin(teams(n));
    const games = rounds.flat().map(([a, b]) => [a.id, b.id].sort().join('-'));
    expect(games).toHaveLength((n * (n - 1)) / 2);
    expect(new Set(games).size).toBe(games.length);
    for (const round of rounds) {
      const ids = round.flatMap(([a, b]) => [a.id, b.id]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('pairings', () => {
  it('refuses fewer than 2 teams, and a knockout that is not 2, 4, 8 or 16', () => {
    expect(pairingProblem(1, 'league')).toMatch(/at least 2 teams/);
    expect(pairingProblem(6, 'knockout')).toMatch(/2, 4, 8 or 16 teams/);
    expect(pairingProblem(6, 'league')).toBeNull();
    expect(generatePairings(teams(6), 'knockout')).toEqual([]);
  });

  it('draws a knockout of 8 as quarter-finals, semi-finals and a final fed by match numbers', () => {
    const p = generatePairings(teams(8), 'knockout');
    expect(p.map((m) => m.stage)).toEqual([...Array(4).fill('Quarter-final'), 'Semi-final', 'Semi-final', 'Final']);
    expect(label(p[0])).toBe('t1 v t8');
    expect(label(p[3])).toBe('t4 v t5');
    expect(label(p[4])).toBe('Winner of Match 1 v Winner of Match 2');
    expect(label(p[6])).toBe('Winner of Match 5 v Winner of Match 6');
    expect(p.map((m) => m.round)).toEqual([1, 1, 1, 1, 2, 2, 3]);
  });

  it('follows a league of 4 with semi-finals by league place and a final', () => {
    const p = generatePairings(teams(4), 'league-knockout');
    expect(p.filter((m) => m.stage === 'League')).toHaveLength(6);
    expect(p.slice(6).map(label)).toEqual(['1st in league v 4th in league', '2nd in league v 3rd in league', 'Winner of Match 7 v Winner of Match 8']);
    expect(p.map((m) => m.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('goes straight to a final after a league of 3, and has no knockout in a round robin', () => {
    expect(generatePairings(teams(3), 'league-knockout').at(-1)).toMatchObject({ stage: 'Final', round: 1 });
    expect(generatePairings(teams(6), 'league').every((m) => m.stage === 'League')).toBe(true);
  });
});
