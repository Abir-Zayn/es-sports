import type { EnteredTeam } from '../data/tournament-repository';
import { fillRatio, groupTeams, teamsSummary } from '../teams/group-teams';

const entry = (id: string, eliminated: boolean) =>
  ({ team: { id, name: id, shortName: id, tone: 'blue', logoUrl: null }, owner: null, eliminated }) as unknown as EnteredTeam;

describe('team grouping', () => {
  it('keeps join order and moves eliminated teams to their own group', () => {
    const { active, eliminated } = groupTeams([entry('a', false), entry('b', true), entry('c', false)]);
    expect(active.map((t) => t.team.id)).toEqual(['a', 'c']);
    expect(eliminated.map((t) => t.team.id)).toEqual(['b']);
  });

  it('summarises who is still in, or how many places are left', () => {
    expect(teamsSummary(6, 8, 2)).toBe('4 still in · 2 eliminated');
    expect(teamsSummary(3, 4, 0)).toBe('1 place left');
    expect(teamsSummary(2, 4, 0)).toBe('2 places left');
    expect(teamsSummary(4, 4, 0)).toBe('Line-up complete');
  });

  it('never returns NaN or more than full for the fill bar', () => {
    expect(fillRatio(3, 0)).toBe(0);
    expect(fillRatio(5, 4)).toBe(1);
    expect(fillRatio(2, 4)).toBe(0.5);
  });
});
