import { pickSquad } from './pick-squad';

const squad = Array.from({ length: 12 }, (_, i) => `p${i + 1}`);

describe('pickSquad', () => {
  it('takes the whole squad when it fits the XI', () => {
    expect(pickSquad(['a', 'b', 'c'], 11)).toEqual(['a', 'b', 'c']);
    expect(pickSquad(['a', 'b'], 2)).toEqual(['a', 'b']);
  });

  it('draws exactly the limit from a bigger squad, with no repeats, in squad order', () => {
    for (let run = 0; run < 50; run += 1) {
      const xi = pickSquad(squad, 11);
      expect(xi).toHaveLength(11);
      expect(new Set(xi).size).toBe(11);
      expect(xi).toEqual(squad.filter((id) => xi.includes(id)));
    }
  });

  it('leaves out whoever the random draw decides', () => {
    // random() = 0 never swaps, so the first 11 stay and the 12th is left out.
    const low = pickSquad(squad, 11, () => 0);
    expect(low).not.toContain('p12');
    const high = pickSquad(squad, 11, () => 0.999);
    expect(high).toContain('p12');
    expect(high).not.toEqual(low);
  });
});
