import { generatePairings } from '../generate';
import { dayFitProblem, moveProblem, placeMatches, timeLabel, tournamentDays } from '../slots';
import type { ScheduledMatch, ScheduleTeam } from '../types';

const teams = (n: number): ScheduleTeam[] => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}`, short: `T${i + 1}` }));
const sides = (m: ScheduledMatch) => [m.home, m.away].map((s) => (s.kind === 'team' ? s.team.id : s.label));

describe('times and days', () => {
  it('labels minutes as a clock time', () => {
    expect(timeLabel(540)).toBe('9:00 AM');
    expect(timeLabel(13 * 60 + 30)).toBe('1:30 PM');
    expect(timeLabel(0)).toBe('12:00 AM');
    expect(timeLabel(12 * 60)).toBe('12:00 PM');
  });

  it('lists every tournament day, and none for a backwards range', () => {
    expect(tournamentDays('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(tournamentDays('2026-11-02', '2026-10-30')).toEqual([]);
  });

  it('refuses more matches a day than fit before 11 PM', () => {
    expect(dayFitProblem({ perDay: 3, firstStartMin: 540 }, 'T20')).toBeNull();
    expect(dayFitProblem({ perDay: 4, firstStartMin: 540 }, 'T20')).toMatch(/run past 11:00 PM/);
    expect(dayFitProblem({ perDay: 2, firstStartMin: 540 }, 'ODI')).toMatch(/run past/);
  });
});

describe('placing matches', () => {
  const days = tournamentDays('2026-11-01', '2026-11-30');

  it('never puts a team in two matches on one day, and spaces matches one slot apart', () => {
    const { matches, problem } = placeMatches(generatePairings(teams(6), 'league'), days, { perDay: 3, firstStartMin: 540 }, 'T20');
    expect(problem).toBeNull();
    expect(matches).toHaveLength(15);
    for (const day of new Set(matches.map((m) => m.date))) {
      const today = matches.filter((m) => m.date === day);
      const ids = today.flatMap(sides);
      expect(new Set(ids).size).toBe(ids.length);
      expect(today.map((m) => m.startMin)).toEqual([540, 780, 1020].slice(0, today.length));
    }
  });

  it('gives each knockout round its own days, after the round before', () => {
    const { matches } = placeMatches(generatePairings(teams(4), 'league-knockout'), days, { perDay: 2, firstStartMin: 540 }, 'T20');
    const dayOf = (stage: string) => matches.filter((m) => m.stage === stage).map((m) => m.date);
    const lastLeague = dayOf('League').sort().at(-1)!;
    expect(dayOf('Semi-final').every((d) => d > lastLeague)).toBe(true);
    expect(dayOf('Final')[0] > dayOf('Semi-final').sort().at(-1)!).toBe(true);
  });

  it('says how many days it needs when the tournament is too short', () => {
    const result = placeMatches(generatePairings(teams(8), 'league'), days.slice(0, 5), { perDay: 2, firstStartMin: 540 }, 'T20');
    expect(result.problem).toBe('This needs 14 days, but the tournament runs 5. Play more matches a day or move the end date.');
  });

  it('refuses a move onto a busy slot or a day a team already plays', () => {
    const { matches } = placeMatches(generatePairings(teams(4), 'league'), days, { perDay: 2, firstStartMin: 540 }, 'T20');
    const [first, second, third] = matches;
    expect(moveProblem(matches, third.id, first.date, first.startMin, 'T20')).toBe('Another match is on the ground at that time.');
    const sharesTeam = sides(third).some((s) => sides(first).includes(s) || sides(second).includes(s));
    expect(sharesTeam).toBe(true);
    expect(moveProblem(matches, third.id, first.date, 20 * 60, 'T20')).toMatch(/run past/);
    expect(moveProblem(matches, third.id, first.date, 17 * 60, 'T20')).toMatch(/already plays Match/);
    expect(moveProblem(matches, third.id, '2026-11-20', 600, 'T20')).toBeNull();
  });
});
