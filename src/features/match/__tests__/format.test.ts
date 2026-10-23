import { economy, oversToBalls, strikeRate } from '../format';

describe('match figures', () => {
  it('counts overs as balls', () => {
    expect(oversToBalls('3.3')).toBe(21);
    expect(oversToBalls('4')).toBe(24);
  });

  it('computes economy per over', () => {
    expect(economy(28, '3.3')).toBe('8.00');
    expect(economy(0, '0')).toBe('0.00');
  });

  it('computes strike rate', () => {
    expect(strikeRate(68, 41)).toBe('165.85');
    expect(strikeRate(0, 0)).toBe('0.00');
  });
});
