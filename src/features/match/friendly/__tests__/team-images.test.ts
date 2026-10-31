import * as SecureStore from 'expo-secure-store';

import { abandonFriendlyMatches, existingMatchIds } from '@/features/scoring/data/friendly-create';

import { sweepOrphanTeamImages, sweepOrphanTeamImagesDaily } from '../team-image-sweep';

const USER = '11111111-1111-4111-8111-111111111111';
const OLD_MATCH = '22222222-2222-4222-8222-222222222222';
const YOUNG_MATCH = '33333333-3333-4333-8333-333333333333';
const SAVED_MATCH = '44444444-4444-4444-8444-444444444444';
const NOW = Date.parse('2026-10-31T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ROOT = `${USER}/friendly`;

const file = (name: string, ageMs: number) => {
  const at = new Date(NOW - ageMs).toISOString();
  return { name, id: `file-${name}`, created_at: at, updated_at: at };
};
const folder = (name: string) => ({ name, id: null, created_at: null, updated_at: null });
/** A match id that sorts before the fixed ids above, numbered so folders list in order. */
const savedId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** Storage listing by folder path, paged like the real API. */
let tree: Record<string, unknown[]> = {};
const mockList = jest.fn((path: string, options?: { limit?: number; offset?: number }) => {
  const offset = options?.offset ?? 0;
  return Promise.resolve({ data: (tree[path] ?? []).slice(offset, offset + (options?.limit ?? 100)), error: null });
});
const mockRemove = jest.fn((_paths: string[]) => Promise.resolve({ data: [], error: null }));
jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ list: mockList, remove: mockRemove }) } },
}));
jest.mock('@/features/scoring/data/friendly-create', () => ({ existingMatchIds: jest.fn(), abandonFriendlyMatches: jest.fn() }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

/** The server knows these ids as saved matches. */
const savedOnServer = (ids: Set<string>) =>
  jest.mocked(existingMatchIds).mockImplementation(async (batch) => new Set(batch.filter((id) => ids.has(id))));

beforeEach(() => {
  mockList.mockClear();
  mockRemove.mockClear();
  jest.mocked(existingMatchIds).mockReset().mockResolvedValue(new Set());
  jest.mocked(abandonFriendlyMatches).mockReset().mockImplementation(async (ids) => new Set(ids));
  jest.mocked(SecureStore.getItemAsync).mockReset().mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockReset().mockResolvedValue(undefined);
  tree = {
    [ROOT]: [folder(OLD_MATCH), folder(YOUNG_MATCH), folder(SAVED_MATCH), folder('not-a-match')],
    [`${ROOT}/${OLD_MATCH}`]: [file('a', 2 * DAY), file('b', 2 * DAY)],
    [`${ROOT}/${YOUNG_MATCH}`]: [file('a', 2 * DAY), file('b', 60 * 1000)],
    [`${ROOT}/${SAVED_MATCH}`]: [file('a', 3 * DAY)],
  };
});

describe('sweeping orphaned team images', () => {
  it('removes only old folders that have no saved match', async () => {
    savedOnServer(new Set([SAVED_MATCH]));
    await sweepOrphanTeamImages(USER, NOW);
    expect(existingMatchIds).toHaveBeenCalledWith([OLD_MATCH, YOUNG_MATCH, SAVED_MATCH]);
    expect(mockList).not.toHaveBeenCalledWith(`${ROOT}/${SAVED_MATCH}`, expect.anything());
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith([`${ROOT}/${OLD_MATCH}/a`, `${ROOT}/${OLD_MATCH}/b`]);
  });

  it('reaches an orphan listed after more saved folders than one run checks', async () => {
    const saved = Array.from({ length: 60 }, (_, i) => savedId(i));
    tree[ROOT] = [...saved.map(folder), folder(OLD_MATCH)];
    savedOnServer(new Set(saved));
    await sweepOrphanTeamImages(USER, NOW);
    expect(mockRemove).toHaveBeenCalledWith([`${ROOT}/${OLD_MATCH}/a`, `${ROOT}/${OLD_MATCH}/b`]);
  });

  it('follows the folder listing page by page and asks about ids in batches', async () => {
    const saved = Array.from({ length: 150 }, (_, i) => savedId(i));
    tree[ROOT] = [...saved.map(folder), folder(OLD_MATCH)];
    savedOnServer(new Set(saved));
    await sweepOrphanTeamImages(USER, NOW);
    expect(mockList).toHaveBeenCalledWith(ROOT, { limit: 100, offset: 100 });
    expect(jest.mocked(existingMatchIds).mock.calls.map(([batch]) => batch.length)).toEqual([100, 51]);
    expect(mockRemove).toHaveBeenCalledWith([`${ROOT}/${OLD_MATCH}/a`, `${ROOT}/${OLD_MATCH}/b`]);
  });

  it('removes nothing when the server cannot say which matches exist', async () => {
    jest.mocked(existingMatchIds).mockRejectedValue(new Error('offline'));
    await expect(sweepOrphanTeamImages(USER, NOW)).rejects.toThrow('offline');
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('runs at most once a day per account and never throws', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(String(NOW - DAY / 2));
    await sweepOrphanTeamImagesDaily(USER, NOW);
    expect(mockList).not.toHaveBeenCalled();

    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(String(NOW - 2 * DAY));
    mockList.mockRejectedValueOnce(new Error('offline'));
    await expect(sweepOrphanTeamImagesDaily(USER, NOW)).resolves.toBeUndefined();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`friendly-image-sweep-v1.${USER}`, String(NOW));
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

describe('coordinating the sweep with late saves', () => {
  it('deletes only the folders the server abandoned', async () => {
    savedOnServer(new Set([SAVED_MATCH]));
    jest.mocked(abandonFriendlyMatches).mockResolvedValue(new Set());
    await sweepOrphanTeamImages(USER, NOW);
    expect(abandonFriendlyMatches).toHaveBeenCalledWith([OLD_MATCH]);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('reaches an old orphan behind more young unsaved folders than one run checks', async () => {
    const young = Array.from({ length: 60 }, (_, i) => savedId(i));
    tree[ROOT] = [...young.map(folder), folder(OLD_MATCH)];
    for (const id of young) tree[`${ROOT}/${id}`] = [file('a', 60 * 1000)];
    // Random order: an orphan outside the first 50 in one run is checked in a later one.
    for (let run = 0; run < 30 && mockRemove.mock.calls.length === 0; run++) await sweepOrphanTeamImages(USER, NOW);
    expect(mockRemove).toHaveBeenCalledWith([`${ROOT}/${OLD_MATCH}/a`, `${ROOT}/${OLD_MATCH}/b`]);
  });
});
