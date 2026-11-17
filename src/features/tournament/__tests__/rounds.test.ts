import type { RoundView } from '../data/rounds-repository';
import type { StandingsRow } from '../data/standings-repository';
import { bracketSlots, groupChoices, isKnockoutSize, isRoundComplete, rankByPlace, seedOrder, topOfEachGroup } from '../rounds/next-round';
import { knockoutPairings } from '../schedule-builder/generate';
import { drawSchedule } from '../schedule-builder/round-draw';
import type { ScheduledMatch } from '../schedule-builder/types';

const team = (id: string) => ({ id, name: id, short: id });
const round = (teamIds: string[], groups: number, groupOf: [string, number][], r = 0): RoundView =>
  ({ round: r, kind: 'groups', groups, advance: 2, teamIds, groupOf: new Map(groupOf), slots: [] });
const row = (teamId: string) => ({ teamId }) as StandingsRow;

describe('who goes through', () => {
  // Group A: a1 a2 a3 a4, Group B: b1 b2 b3 b4, table order mixes the groups.
  const r = round(['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'], 2,
    [['a1', 0], ['a2', 0], ['a3', 0], ['a4', 0], ['b1', 1], ['b2', 1], ['b3', 1], ['b4', 1]]);
  const ranked = rankByPlace(r, ['b1', 'a1', 'a2', 'b2', 'b3', 'a3', 'a4', 'b4'].map(row));

  it('ranks by place, then group', () => {
    expect(ranked).toEqual(['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'a4', 'b4']);
    expect(topOfEachGroup(r, ranked, 3)).toEqual(['a1', 'b1', 'a2', 'b2', 'a3', 'b3']);
  });

  it('pairs group winners against the other group runners-up', () => {
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(bracketSlots(topOfEachGroup(r, ranked, 2))).toEqual(['a1', 'b2', 'b1', 'a2']);
  });

  it('knows when the knockout starts and how a group round can split', () => {
    expect([2, 4, 8, 6, 16].map(isKnockoutSize)).toEqual([true, true, true, false, false]);
    expect(groupChoices(6)).toEqual([1, 2]);
    expect(groupChoices(12)).toEqual([1, 2, 3, 4]);
  });
});

const played = (number: number, r: number, date: string, status = 'completed'): ScheduledMatch => ({
  id: `f${number}`, number, stage: 'League', round: r, date, startMin: 540, home: { kind: 'team', team: team('a1') },
  away: { kind: 'team', team: team('a2') }, started: true, match: { status } as ScheduledMatch['match'],
});

describe('rounds in the schedule', () => {
  it('a round is complete once every league match of it is finished or cancelled', () => {
    const r = round(['a1', 'a2'], 1, [['a1', 0], ['a2', 0]]);
    expect(isRoundComplete(r, [played(1, 0, '2030-01-01')])).toBe(true);
    expect(isRoundComplete(r, [played(1, 0, '2030-01-01', 'live')])).toBe(false);
    expect(isRoundComplete(r, [{ ...played(1, 0, '2030-01-01', 'live'), cancelled: { reason: 'Rain' } }])).toBe(true);
    expect(isRoundComplete(r, [])).toBe(false);
  });

  it('numbers a bracket after earlier matches and names the feeders', () => {
    const ko = knockoutPairings(['a', 'b', 'c', 'd'].map(team), 12);
    expect(ko.map((p) => `${p.number} ${p.stage}`)).toEqual(['13 Semi-final', '14 Semi-final', '15 Final']);
    expect(ko[2].home).toEqual({ kind: 'tbd', label: 'Winner of Match 13' });
    expect(ko[0]).toMatchObject({ home: { team: { id: 'a' } }, away: { team: { id: 'b' } } });
  });

  it('keeps earlier rounds and adds the knockout on later days', () => {
    const before = [played(1, 0, '2030-01-01'), played(2, 0, '2030-01-02')];
    const days = ['2030-01-01', '2030-01-02', '2030-01-03', '2030-01-04'];
    const drawn = drawSchedule({ round: 1, kind: 'knockout', groupIds: null, slots: ['a', 'b', 'c', 'd'] },
      ['a', 'b', 'c', 'd'].map(team), 'league', before, days, { perDay: 2, firstStartMin: 540 }, 10);
    expect(drawn.problem).toBeNull();
    const added = (drawn.matches ?? []).filter((m) => m.stage !== 'League');
    expect((drawn.matches ?? []).slice(0, 2)).toEqual(before);
    expect(added.map((m) => m.number)).toEqual([3, 4, 5]);
    expect(added.every((m) => m.date > '2030-01-02')).toBe(true);
  });

  it('refuses a group round before its draw', () => {
    const drawn = drawSchedule({ round: 1, kind: 'groups', groupIds: null, slots: [] }, [], 'league', [], [], { perDay: 2, firstStartMin: 540 }, 10);
    expect(drawn.problem).toBe('Draw the groups on the Groups tab first.');
  });
});
