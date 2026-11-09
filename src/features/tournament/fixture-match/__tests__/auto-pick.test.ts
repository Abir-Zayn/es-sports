import type { ServerSquad } from '../../squad/server/squad-server';
import { autoPickXi } from '../auto-pick';

const candidate = (profileId: string, availability: string) => ({ profileId, name: profileId, avatarUrl: null, availability }) as unknown as ServerSquad['candidates'][number];
const squad = (candidates: ServerSquad['candidates'], selectedIds: string[]) => ({ candidates, selectedIds }) as unknown as ServerSquad;

describe('autoPickXi', () => {
  it('takes the first available registered players up to the limit', () => {
    const s = squad([candidate('a', 'available'), candidate('b', 'injured'), candidate('c', 'available'), candidate('d', 'available')], ['a', 'b', 'c', 'd']);
    expect(autoPickXi(s, 2)).toEqual(['a', 'c']);
  });

  it('ignores players who are not registered in the squad', () => {
    expect(autoPickXi(squad([candidate('a', 'available'), candidate('b', 'available')], ['b']), 5)).toEqual(['b']);
  });

  it('returns fewer when the squad is short', () => {
    expect(autoPickXi(squad([candidate('a', 'resting')], ['a']), 3)).toEqual([]);
  });
});
