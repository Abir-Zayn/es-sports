import * as SecureStore from 'expo-secure-store';

import { existingMatchIds } from '@/features/scoring/data/friendly-create';

import { sweepOrphanTeamImages, sweepOrphanTeamImagesDaily } from '../team-image-sweep';
import { discardUnsavedTeamImages } from '../team-images';

const USER = '11111111-1111-4111-8111-111111111111';
const OLD_MATCH = '22222222-2222-4222-8222-222222222222';
const YOUNG_MATCH = '33333333-3333-4333-8333-333333333333';
const SAVED_MATCH = '44444444-4444-4444-8444-444444444444';
const NOW = Date.parse('2026-10-31T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const file = (name: string, ageMs: number) => {
  const at = new Date(NOW - ageMs).toISOString();
  return { name, id: `file-${name}`, created_at: at, updated_at: at };
};
const folder = (name: string) => ({ name, id: null, created_at: null, updated_at: null });

/** Storage listing by folder path. */
let tree: Record<string, unknown[]> = {};
const mockList = jest.fn((path: string) => Promise.resolve({ data: tree[path] ?? [], error: null }));
const mockRemove = jest.fn((_paths: string[]) => Promise.resolve({ data: [], error: null }));
jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ list: mockList, remove: mockRemove }) } },
}));
jest.mock('@/features/scoring/data/friendly-create', () => ({ existingMatchIds: jest.fn() }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

beforeEach(() => {
  mockList.mockClear();
  mockRemove.mockClear();
  jest.mocked(existingMatchIds).mockReset().mockResolvedValue(new Set());
  jest.mocked(SecureStore.getItemAsync).mockReset().mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockReset().mockResolvedValue(undefined);
  tree = {
    [`${USER}/friendly`]: [folder(OLD_MATCH), folder(YOUNG_MATCH), folder(SAVED_MATCH), folder('not-a-match')],
    [`${USER}/friendly/${OLD_MATCH}`]: [file('a', 2 * DAY), file('b', 2 * DAY)],
    [`${USER}/friendly/${YOUNG_MATCH}`]: [file('a', 2 * DAY), file('b', 60 * 1000)],
    [`${USER}/friendly/${SAVED_MATCH}`]: [file('a', 3 * DAY)],
  };
});

describe('discarding the images of an abandoned save', () => {
  it('removes the images when the match does not exist on the server', async () => {
    await discardUnsavedTeamImages(USER, OLD_MATCH);
    expect(existingMatchIds).toHaveBeenCalledWith([OLD_MATCH]);
    expect(mockRemove).toHaveBeenCalledWith([`${USER}/friendly/${OLD_MATCH}/a`, `${USER}/friendly/${OLD_MATCH}/b`]);
  });

  it('keeps the images when the match exists', async () => {
    jest.mocked(existingMatchIds).mockResolvedValue(new Set([SAVED_MATCH]));
    await discardUnsavedTeamImages(USER, SAVED_MATCH);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('keeps the images and stays quiet when the server cannot answer', async () => {
    jest.mocked(existingMatchIds).mockRejectedValue(new Error('offline'));
    await expect(discardUnsavedTeamImages(USER, OLD_MATCH)).resolves.toBeUndefined();
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

describe('sweeping orphaned team images', () => {
  it('removes only old folders that have no saved match', async () => {
    jest.mocked(existingMatchIds).mockResolvedValue(new Set([SAVED_MATCH]));
    await sweepOrphanTeamImages(USER, NOW);
    expect(existingMatchIds).toHaveBeenCalledWith([OLD_MATCH, SAVED_MATCH]);
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith([`${USER}/friendly/${OLD_MATCH}/a`, `${USER}/friendly/${OLD_MATCH}/b`]);
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
