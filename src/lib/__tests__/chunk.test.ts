import { chunk } from '../chunk';

describe('chunk', () => {
  it('splits into rows with a shorter last row', () => {
    expect(chunk([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
  });

  it('returns no rows for an empty list', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});
