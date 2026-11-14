import { generatePairings } from '../generate';
import { dayFitProblem, moveProblem, placeMatches, slotMinutes, timeLabel, tournamentDays } from '../slots';
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
    expect(dayFitProblem({ perDay: 3, firstStartMin: 540 }, 20)).toBeNull();
    expect(dayFitProblem({ perDay: 4, firstStartMin: 540 }, 20)).toMatch(/run past 11:00 PM/);
    expect(dayFitProblem({ perDay: 2, firstStartMin: 540 }, 50)).toMatch(/run past/);
  });
});

describe('placing matches', () => {
  const days = tournamentDays('2026-11-01', '2026-11-30');

  it('never puts a team in two matches on one day, and spaces matches one slot apart', () => {
    const { matches, problem } = placeMatches(generatePairings(teams(6), 'league'), days, { perDay: 3, firstStartMin: 540 }, 20);
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
    const { matches } = placeMatches(generatePairings(teams(4), 'league-knockout'), days, { perDay: 2, firstStartMin: 540 }, 20);
    const dayOf = (stage: string) => matches.filter((m) => m.stage === stage).map((m) => m.date);
    const lastLeague = dayOf('League').sort().at(-1)!;
    expect(dayOf('Semi-final').every((d) => d > lastLeague)).toBe(true);
    expect(dayOf('Final')[0] > dayOf('Semi-final').sort().at(-1)!).toBe(true);
  });

  it('says how many days it needs when the tournament is too short', () => {
    const result = placeMatches(generatePairings(teams(8), 'league'), days.slice(0, 5), { perDay: 2, firstStartMin: 540 }, 20);
    expect(result.problem).toBe('This needs 14 days, but the tournament runs 5. Play more matches a day or move the end date.');
  });

  it('allows up to 3 matches per team in a day, and pushes a 4th match to the next day', () => {
    const [t1, t2, t3, t4] = teams(4);
    const fourWithT1 = [
      { number: 1, stage: 'League' as const, round: 0, home: { kind: 'team' as const, team: t1 }, away: { kind: 'team' as const, team: t2 } },
      { number: 2, stage: 'League' as const, round: 0, home: { kind: 'team' as const, team: t1 }, away: { kind: 'team' as const, team: t3 } },
      { number: 3, stage: 'League' as const, round: 0, home: { kind: 'team' as const, team: t1 }, away: { kind: 'team' as const, team: t4 } },
      { number: 4, stage: 'League' as const, round: 0, home: { kind: 'team' as const, team: t1 }, away: { kind: 'team' as const, team: t2 } },
    ];
    const { matches, problem } = placeMatches(fourWithT1, days, { perDay: 4, firstStartMin: 8 * 60 }, 10);
    expect(problem).toBeNull();
    expect(matches.slice(0, 3).every((m) => m.date === days[0])).toBe(true);
    expect(matches[3].date).toBe(days[1]);
  });

  it('refuses a move onto a busy slot or a 4th match for a team on the same day', () => {
    const { matches } = placeMatches(generatePairings(teams(4), 'league'), days, { perDay: 2, firstStartMin: 540 }, 20);
    const [first, second, third] = matches;
    expect(moveProblem(matches, third.id, first.date, first.startMin, 20)).toBe('Another match is on the ground at that time.');
    const sharesTeam = sides(third).some((s) => sides(first).includes(s) || sides(second).includes(s));
    expect(sharesTeam).toBe(true);
    expect(moveProblem(matches, third.id, first.date, 20 * 60, 20)).toMatch(/run past/);
    // A 2nd or 3rd match for the same team on the same day is allowed when the ground is free.
    expect(moveProblem(matches, third.id, first.date, 17 * 60, 20)).toBeNull();
    expect(moveProblem(matches, third.id, '2026-11-20', 600, 20)).toBeNull();

    const [t1, t2, t3, t4] = teams(4);
    const make = (n: number, startMin: number, opp: ScheduleTeam): ScheduledMatch => ({
      id: `m${n}`, number: n, stage: 'League', round: 0, date: '2026-11-01', startMin,
      home: { kind: 'team', team: t1 }, away: { kind: 'team', team: opp },
    });
    const busyDay = [make(1, 7 * 60, t2), make(2, 11 * 60, t3), make(3, 15 * 60, t4), make(4, 19 * 60, t2)];
    expect(moveProblem(busyDay, 'm4', '2026-11-01', 19 * 60, 20)).toBe('A team in this match already plays 3 matches that day.');
  });
});

describe('ground time from overs', () => {
  it('keeps 12 minutes an over, rounded up to half an hour, between 1 and 8 hours', () => {
    expect([4, 6, 10, 12, 20, 35, 40, 50].map(slotMinutes)).toEqual([60, 90, 120, 150, 240, 420, 480, 480]);
  });

  it('names the overs when a day cannot fit the matches', () => {
    expect(dayFitProblem({ perDay: 4, firstStartMin: 540 }, 25)).toMatch(/4 25-over matches from 9:00 AM/);
  });
});
