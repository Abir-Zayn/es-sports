import { newFriendly, renameTeam } from '../friendly-rules';
import { battingFirstSide, decideToss, flipCoin, teamLabel, tossWinner } from '../toss';

describe('coin toss', () => {
  it('lands by the random draw', () => {
    expect(flipCoin(() => 0.1)).toBe('heads');
    expect(flipCoin(() => 0.9)).toBe('tails');
  });

  it('is a fair coin over many flips', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const heads = Array.from({ length: 2000 }, () => flipCoin(random)).filter((c) => c === 'heads').length;
    expect(heads).toBeGreaterThan(900);
    expect(heads).toBeLessThan(1100);
  });

  it('gives the toss to the caller only on a correct call', () => {
    expect(tossWinner('teamA', 'heads', 'heads')).toBe('teamA');
    expect(tossWinner('teamA', 'heads', 'tails')).toBe('teamB');
  });

  it('works out who bats first from the decision', () => {
    const toss = decideToss({ calledBy: 'teamB', call: 'tails', landed: 'tails' }, 'bowl', new Date('2026-10-29T10:00:00Z'));
    expect(toss).toEqual({ calledBy: 'teamB', call: 'tails', landed: 'tails', winner: 'teamB', decision: 'bowl', tossedAt: '2026-10-29T10:00:00.000Z' });
    expect(battingFirstSide(toss)).toBe('teamA');
    expect(battingFirstSide({ ...toss, decision: 'bat' })).toBe('teamB');
  });

  it('labels unnamed teams', () => {
    const setup = renameTeam(newFriendly('f', 'me', new Date()), 'teamA', 'Kings');
    expect([teamLabel(setup, 'teamA'), teamLabel(setup, 'teamB')]).toEqual(['Kings', 'Team B']);
  });
});
