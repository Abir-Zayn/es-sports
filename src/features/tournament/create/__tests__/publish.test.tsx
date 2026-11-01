import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import type { ReactNode } from 'react';

import { fake } from '../../__fixtures__/supabase-fake';
import { emptyDraft, localDateKey } from '../draft';
import { clearDraft } from '../draft-storage';
import { publishIdFor, usePublishTournament } from '../use-publish-tournament';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../../__fixtures__/supabase-fake').fake }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../draft-storage', () => ({ clearDraft: jest.fn(async () => undefined), draftQueryKey: (id: string) => ['tournament-draft', id] }));

const getItem = jest.mocked(SecureStore.getItemAsync);
const setItem = jest.mocked(SecureStore.setItemAsync);
const deleteItem = jest.mocked(SecureStore.deleteItemAsync);
const today = localDateKey(new Date());
const draft = { ...emptyDraft, name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', startDate: today, endDate: today };
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return Wrapper;
}

beforeEach(() => {
  jest.clearAllMocks();
  fake.reset();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue();
  deleteItem.mockResolvedValue();
});

describe('the id a draft is published under', () => {
  it('makes a uuid once and keeps it for the account', async () => {
    const id = await publishIdFor('me');
    expect(id).toMatch(ID);
    expect(setItem).toHaveBeenCalledWith('tournament-publish-id-v1.me', id);
    getItem.mockResolvedValue(id);
    await expect(publishIdFor('me')).resolves.toBe(id);
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});

describe('publishing', () => {
  it('creates the tournament under the stored id, then forgets the id and the draft', async () => {
    getItem.mockResolvedValue('stored-id');
    fake.rpcResult = { data: 'stored-id', error: null };
    const { result } = await renderHook(() => usePublishTournament('me'), { wrapper: wrapper() });
    let id = '';
    await act(async () => { id = await result.current.mutateAsync(draft); });
    expect(id).toBe('stored-id');
    expect(fake.rpc).toHaveBeenCalledWith('create_tournament', { p: expect.objectContaining({ id: 'stored-id', name: 'Port City Cup' }) });
    expect(deleteItem).toHaveBeenCalledWith('tournament-publish-id-v1.me');
    expect(clearDraft).toHaveBeenCalledWith('me');
  });

  it('keeps the id and the draft when the server refuses, so a retry reaches the same tournament', async () => {
    getItem.mockResolvedValue('stored-id');
    fake.rpcResult = { data: null, error: { code: '08006', message: 'offline' } };
    const { result } = await renderHook(() => usePublishTournament('me'), { wrapper: wrapper() });
    await act(async () => { await result.current.mutateAsync(draft).catch(() => undefined); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(deleteItem).not.toHaveBeenCalled();
    expect(clearDraft).not.toHaveBeenCalled();
    fake.rpcResult = { data: 'stored-id', error: null };
    await act(async () => { await result.current.mutateAsync(draft); });
    expect(fake.rpc.mock.calls.map(([, args]) => (args as { p: { id: string } }).p.id)).toEqual(['stored-id', 'stored-id']);
  });

  it('still succeeds when cleaning the local draft fails', async () => {
    getItem.mockResolvedValue('stored-id');
    jest.mocked(clearDraft).mockRejectedValueOnce(new Error('disk'));
    const { result } = await renderHook(() => usePublishTournament('me'), { wrapper: wrapper() });
    let id = '';
    await act(async () => { id = await result.current.mutateAsync(draft); });
    expect(id).toBe('stored-id');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
