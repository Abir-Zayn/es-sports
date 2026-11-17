import { emptyDraft, fitTeams, teamPresets, teamRange, validateDraft } from '../create/draft';
import { groupRoundRobin } from '../schedule-builder/generate';
import { groupName, splitIntoGroups } from '../teams/group-teams';

describe('team counts for a number of groups', () => {
  it('needs a multiple of the groups, at least 3 per group, from 6 to 48', () => {
    expect(teamRange(1)).toEqual({ min: 6, max: 48, step: 1 });
    expect(teamRange(2)).toEqual({ min: 6, max: 48, step: 2 });
    expect(teamRange(3)).toEqual({ min: 9, max: 48, step: 3 });
    expect(teamRange(5)).toEqual({ min: 15, max: 45, step: 5 });
    expect(teamRange(8)).toEqual({ min: 24, max: 48, step: 8 });
  });

  it('snaps to the nearest count that fits', () => {
    expect(fitTeams(7, 2)).toBe(8);
    expect(fitTeams(8, 3)).toBe(9);
    expect(fitTeams(48, 7)).toBe(42);
    expect(fitTeams(8, 6)).toBe(18);
  });

  it('offers only quick picks that fit', () => {
    expect(teamPresets(4)).toEqual([12, 16, 20, 24, 32]);
    for (let g = 1; g <= 8; g++) teamPresets(g).forEach((n) => expect(fitTeams(n, g)).toBe(n));
  });

  it('refuses a draft whose teams do not split evenly', () => {
    expect(validateDraft({ ...emptyDraft, teams: 10, groups: 3 }).teams).toMatch(/multiple of 3/);
    expect(validateDraft({ ...emptyDraft, teams: 12, groups: 3 }).teams).toBeUndefined();
  });
});

describe('groups', () => {
  it('names groups by letter and splits teams once all are drawn', () => {
    expect(groupName(0)).toBe('Group A');
    expect(groupName(7)).toBe('Group H');
    const teams = [{ id: 'a', group: 1 }, { id: 'b', group: 0 }, { id: 'c', group: 1 }, { id: 'd', group: 0 }];
    expect(splitIntoGroups(teams, 2)?.map((g) => g.map((t) => t.id))).toEqual([['b', 'd'], ['a', 'c']]);
    expect(splitIntoGroups([...teams, { id: 'e', group: null }], 2)).toBeNull();
  });

  it('pairs teams only within their group', () => {
    const t = (id: string) => ({ id, name: id, short: id });
    const teams = ['a', 'b', 'c', 'd', 'e', 'f'].map(t);
    const rounds = groupRoundRobin(teams, [['a', 'b', 'c'], ['d', 'e', 'f']]);
    const pairs = rounds.flat().map(([x, y]) => [x.id, y.id].sort().join(''));
    expect(pairs.sort()).toEqual(['ab', 'ac', 'bc', 'de', 'df', 'ef']);
  });
});
