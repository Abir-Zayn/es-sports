import * as SecureStore from 'expo-secure-store';

import { emptyDraft } from '../draft';
import { loadDraft, saveDraft } from '../draft-storage';
import { discardCover, persistCover } from '../cover-storage';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('../cover-storage', () => ({ persistCover: jest.fn(async (_id: string, uri: string) => uri), discardCover: jest.fn() }));
const getItem = jest.mocked(SecureStore.getItemAsync);
const setItem = jest.mocked(SecureStore.setItemAsync);

describe('account-scoped tournament draft storage', () => {
  beforeEach(() => { jest.clearAllMocks(); getItem.mockResolvedValue(null); setItem.mockResolvedValue(); });
  it('returns no draft for a new account and keeps account keys separate', async () => {
    expect(await loadDraft('player-a')).toBeNull();
    await saveDraft('player-b', { ...emptyDraft, name: '  City Cup  ' });
    expect(getItem).toHaveBeenCalledWith('tournament-draft-v1.player-a');
    expect(setItem).toHaveBeenCalledWith('tournament-draft-v1.player-b', JSON.stringify({ ...emptyDraft, name: 'City Cup' }));
  });
  it('round-trips a partial draft', async () => {
    getItem.mockResolvedValue(JSON.stringify({ ...emptyDraft, name: 'City Cup' }));
    expect(await loadDraft('player-a')).toEqual({ ...emptyDraft, name: 'City Cup' });
  });
  it.each(['broken JSON', JSON.stringify({ ...emptyDraft, teams: 999 })])('reports corrupt stored data without overwriting it', async (stored) => {
    getItem.mockResolvedValue(stored);
    await expect(loadDraft('player-a')).rejects.toThrow('could not be read');
    expect(setItem).not.toHaveBeenCalled();
  });
  it('propagates a failed write', async () => {
    setItem.mockRejectedValueOnce(new Error('Storage full'));
    await expect(saveDraft('player-a', emptyDraft)).rejects.toThrow('Storage full');
  });
  it('keeps maximum-length Unicode fields under the native value limit', async () => {
    await saveDraft('player-a', { ...emptyDraft, name: '🏏'.repeat(40), city: '🏏'.repeat(30), venue: '🏏'.repeat(40) });
    const value = setItem.mock.calls[0][1];
    expect(new TextEncoder().encode(value).length).toBeLessThan(2048);
  });
  it('removes an uncommitted cover after a write failure and preserves the saved cover', async () => {
    getItem.mockResolvedValue(JSON.stringify({ ...emptyDraft, coverUri: 'file:///old-cover.jpg' }));
    jest.mocked(persistCover).mockResolvedValueOnce('file:///new-cover.jpg');
    setItem.mockRejectedValueOnce(new Error('Storage full'));
    await expect(saveDraft('player-a', { ...emptyDraft, coverUri: 'file:///picked.jpg' })).rejects.toThrow('Storage full');
    expect(discardCover).toHaveBeenCalledWith('player-a', 'file:///new-cover.jpg');
    expect(discardCover).not.toHaveBeenCalledWith('player-a', 'file:///old-cover.jpg');
  });
});
