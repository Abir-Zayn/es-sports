import { player, roster, team, user } from '../__fixtures__/roster-fixture';
import { addPlayerProblem, normalisePhone, phoneProblem, removePlayerProblem, squadManagerId, squadShortfall } from '../squad-rules';

const owned = (over: Parameters<typeof team>[1] = {}) => team('a', { name: 'Strikers', owner: { user: user('boss'), status: 'accepted' }, ...over });
const guest = { name: 'Liton Roy', userId: null, phone: null };
const today = '2026-11-05';

describe('squad rules', () => {
  it('lets only an accepted team owner manage the squad', () => {
    expect(squadManagerId(owned())).toBe('boss');
    expect(squadManagerId(team('a', { owner: { user: user('boss'), status: 'pending' } }))).toBeNull();
    expect(addPlayerProblem(roster({ teams: [owned()] }), 'a', 'owner', guest, '', today)).toMatch(/Only the team owner/);
    expect(addPlayerProblem(roster({ teams: [owned()] }), 'a', 'boss', guest, '', today)).toBeNull();
  });

  it('follows the registration window, and after the lock asks for a reason', () => {
    const closed = roster({ teams: [owned()], registration: { opensOn: '', deadline: '', closedEarly: true } });
    expect(addPlayerProblem(closed, 'a', 'boss', guest, '', today)).toMatch(/Registration is closed/);
    const upcoming = roster({ teams: [owned()], registration: { opensOn: '2026-12-01', deadline: '', closedEarly: false } });
    expect(addPlayerProblem(upcoming, 'a', 'boss', guest, '', today)).toMatch(/not opened yet/);
    const locked = roster({ teams: [owned()], locked: true });
    expect(addPlayerProblem(locked, 'a', 'boss', guest, '', today)).toMatch(/Give a reason/);
    expect(addPlayerProblem(locked, 'a', 'boss', guest, 'Injury replacement', today)).toBeNull();
  });

  it('caps the squad at the tournament maximum and checks names and phones', () => {
    const full = owned({ players: Array.from({ length: 10 }, (_, i) => player(`p${i}`)) });
    expect(addPlayerProblem(roster({ teams: [full] }), 'a', 'boss', guest, '', today)).toMatch(/limited to 10/);
    expect(addPlayerProblem(roster({ teams: [owned()] }), 'a', 'boss', { ...guest, name: 'L' }, '', today)).toMatch(/2 to 40/);
    expect(addPlayerProblem(roster({ teams: [owned()] }), 'a', 'boss', { ...guest, phone: '123' }, '', today)).toMatch(/10 to 15 digits/);
  });

  it('stops one person playing for two teams, by account or by phone', () => {
    const other = team('b', { name: 'Kings', players: [player('x', { userId: 'u-1', phone: '+8801712000001' })] });
    const r = roster({ teams: [owned(), other] });
    expect(addPlayerProblem(r, 'a', 'boss', { name: 'Rafi', userId: 'u-1', phone: null }, '', today)).toBe('This player is already in the Kings squad.');
    expect(addPlayerProblem(r, 'a', 'boss', { ...guest, phone: '+880 1712-000001' }, '', today)).toBe('This player is already in the Kings squad.');
    const mine = roster({ teams: [owned({ players: [player('y', { userId: 'u-2' })] })] });
    expect(addPlayerProblem(mine, 'a', 'boss', { name: 'Rafi', userId: 'u-2', phone: null }, '', today)).toBe('This player is already in the squad.');
  });

  it('allows removal after registration closes, but asks why once locked', () => {
    const squad = owned({ players: [player('p1')] });
    const closed = roster({ teams: [squad], registration: { opensOn: '', deadline: '', closedEarly: true } });
    expect(removePlayerProblem(closed, 'a', 'boss', 'p1', '', today)).toBeNull();
    expect(removePlayerProblem({ ...closed, locked: true }, 'a', 'boss', 'p1', '', today)).toMatch(/Give a reason/);
    expect(removePlayerProblem(closed, 'a', 'boss', 'gone', '', today)).toMatch(/no longer in the squad/);
  });

  it('normalises phones and counts the shortfall to the minimum squad', () => {
    expect(normalisePhone(' +880 (1712) 345-678 ')).toBe('+8801712345678');
    expect(phoneProblem('')).toBeNull();
    expect(squadShortfall(roster(), owned({ players: [player('p1'), player('p2')] }))).toBe(6);
  });
});
