import type { FriendlyMatchSetup } from '../../types';
import {
  addPlayer, fitPlaying, friendlyProblems, newFriendly, removePlayer, renameTeam, shortName, togglePlaying, withPlayersPerSide,
} from '../friendly-rules';

const ME = 'me';
let n = 0;
const add = (setup: FriendlyMatchSetup, side: 'teamA' | 'teamB', name: string, extra: { userId?: string; phone?: string } = {}) =>
  addPlayer(setup, side, { id: `p${n++}`, name, role: 'Batter', ...extra });
const squadOf = (setup: FriendlyMatchSetup, side: 'teamA' | 'teamB', count: number, prefix: string) =>
  Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`).reduce((s, name) => add(s, side, name), setup);

function ready(): FriendlyMatchSetup {
  let setup = withPlayersPerSide(newFriendly('friendly-x', ME, new Date('2026-10-29T10:00:00Z')), 4);
  setup = renameTeam(renameTeam(setup, 'teamA', 'Karnaphuli Kings'), 'teamB', 'Chattogram Strikers');
  setup = squadOf(setup, 'teamA', 4, 'King');
  return squadOf(setup, 'teamB', 4, 'Striker');
}

describe('friendly setup rules', () => {
  it('starts as a six-over, six-a-side draft scored by the creator', () => {
    expect(newFriendly('friendly-x', ME, new Date())).toMatchObject({ overs: 6, playersPerSide: 6, assignedScorerId: ME, status: 'draft', toss: null });
  });

  it('is ready once both teams are named and full', () => {
    expect(friendlyProblems(ready(), ME)).toEqual({});
  });

  it('names what is missing, per part of the form', () => {
    const draft = add(newFriendly('friendly-x', ME, new Date()), 'teamA', 'Solo Player');
    expect(friendlyProblems(draft, ME)).toEqual({
      teamA: 'Give the team a name of 2 to 30 characters.', teamB: 'Give the team a name of 2 to 30 characters.',
    });
    const named = renameTeam(renameTeam(draft, 'teamA', 'Kings'), 'teamB', 'kings');
    expect(friendlyProblems(named, ME)).toMatchObject({ teamA: 'Pick 6 players to play (1 so far).' });
    expect(friendlyProblems(squadOf(named, 'teamB', 6, 'K'), ME).teamB).toBe('The two teams need different names.');
  });

  it('refuses a format the bowlers cannot cover', () => {
    expect(friendlyProblems({ ...ready(), overs: 20 }, ME).format).toMatch(/With 4 a side, each bowler gets 4 overs: not enough for 20 overs/);
    expect(friendlyProblems({ ...ready(), overs: 12 }, ME).format).toBeUndefined();
  });

  it('benches players beyond the side size and fills the side from the bench', () => {
    let setup = squadOf(withPlayersPerSide(newFriendly('f', ME, new Date()), 4), 'teamA', 6, 'P');
    expect(setup.teamA.players.map((p) => p.playing)).toEqual([true, true, true, true, false, false]);
    setup = removePlayer(setup, 'teamA', setup.teamA.players[0].id);
    expect(setup.teamA.players.filter((p) => p.playing)).toHaveLength(4);
    expect(() => togglePlaying(setup, 'teamA', setup.teamA.players[4].id)).toThrow('4 are already playing. Bench someone first.');
    expect(togglePlaying(setup, 'teamA', setup.teamA.players[0].id).teamA.players[0].playing).toBe(false);
  });

  it('keeps chosen players when the side shrinks or grows', () => {
    const players = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, name: id, role: 'Batter', userId: null, phone: null, playing: i !== 1 }));
    expect(fitPlaying(players, 2).map((p) => p.playing)).toEqual([true, false, true, false]);
    expect(fitPlaying(players, 4).every((p) => p.playing)).toBe(true);
  });

  it('keeps one person to one side, by account or phone', () => {
    let setup = add(newFriendly('f', ME, new Date()), 'teamA', 'Rafi Hasan', { userId: 'u-rafi' });
    expect(() => add(setup, 'teamB', 'Rafi H', { userId: 'u-rafi' })).toThrow('Rafi Hasan is already in a squad for this match.');
    setup = add(setup, 'teamA', 'Liton Roy', { phone: '01712 000001' });
    expect(() => add(setup, 'teamB', 'Liton', { phone: '01712-000001' })).toThrow('Liton Roy is already in a squad for this match.');
    expect(() => add(setup, 'teamB', 'X')).toThrow('Enter a player name of 2 to 40 characters.');
    expect(() => add(setup, 'teamB', 'Bad Phone', { phone: '123' })).toThrow('Enter a phone number of 10 to 15 digits.');
  });

  it('caps a squad at sixteen', () => {
    const full = squadOf(newFriendly('f', ME, new Date()), 'teamA', 16, 'P');
    expect(() => add(full, 'teamA', 'One More')).toThrow('A squad holds at most 16 players.');
  });

  it('only lets an app user in a squad score, and hands scoring back if they leave', () => {
    let setup = add(ready(), 'teamA', 'Rafi Hasan', { userId: 'u-rafi' });
    expect(friendlyProblems({ ...setup, assignedScorerId: 'u-stranger' }, ME).scorer).toBe('The scorer must be you or an app user in one of the squads.');
    setup = { ...setup, assignedScorerId: 'u-rafi' };
    expect(friendlyProblems(setup, ME).scorer).toBeUndefined();
    const rafi = setup.teamA.players.find((p) => p.userId === 'u-rafi');
    expect(removePlayer(setup, 'teamA', rafi?.id ?? '').assignedScorerId).toBe('');
  });

  it('makes a short code for the team avatar', () => {
    expect(shortName('Karnaphuli Kings', 'A')).toBe('KK');
    expect(shortName('Strikers', 'B')).toBe('ST');
    expect(shortName('  ', 'B')).toBe('B');
  });
});
