import { discardCover, persistCover } from '../cover-storage';

const mockCopy = jest.fn();
const mockDelete = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///documents' },
  Directory: class {
    uri: string;
    constructor(...parts: string[]) { this.uri = `${parts.join('/')}/`; }
    create() {}
  },
  File: class {
    uri: string;
    exists = true;
    constructor(base: string | { uri: string }, name?: string) { this.uri = name ? `${typeof base === 'string' ? base : base.uri}${name}` : String(base); }
    copy() { return mockCopy(); }
    delete() { mockDelete(this.uri); }
  },
}));

describe('persistent tournament covers', () => {
  beforeEach(() => { jest.clearAllMocks(); mockCopy.mockResolvedValue(undefined); });
  it('copies a picked cover to the account directory and reuses it on subsequent saves', async () => {
    const stored = await persistCover('player-a', 'file:///cache/picked.jpg');
    expect(stored).toMatch(/^file:\/\/\/documents\/tournament-covers\/player-a\/cover-\d+\.jpg$/);
    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(await persistCover('player-a', stored)).toBe(stored);
    expect(mockCopy).toHaveBeenCalledTimes(1);
  });
  it('never deletes outside the account directory or through path traversal', () => {
    discardCover('player-a', 'file:///documents/tournament-covers/player-b/cover-123.jpg');
    discardCover('player-a', 'file:///documents/tournament-covers/player-a/cover-../private.jpg');
    discardCover('player-a', 'file:///cache/picked.jpg');
    expect(mockDelete).not.toHaveBeenCalled();
    discardCover('player-a', 'file:///documents/tournament-covers/player-a/cover-123.jpg');
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
  it('cleans up a partial copy without hiding the original error', async () => {
    mockCopy.mockRejectedValueOnce(new Error('Disk full'));
    await expect(persistCover('player-a', 'file:///cache/picked.jpg')).rejects.toThrow('Disk full');
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
