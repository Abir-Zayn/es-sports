import { supabase } from '@/lib/supabase';

import {
  acceptHandover, cancelHandover, declineHandover, fetchAcceptedHandover, fetchIncomingHandovers, fetchNames, fetchOpenHandover,
  fetchTakeoverFacts, offerHandover, takeOverScoring,
} from '../handover-repository';
import { HandoverError } from '../handover-errors';
import type { HandoverRow } from '../types';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn(), from: jest.fn() } }));

const rpc = jest.mocked(supabase.rpc) as unknown as jest.Mock;
const from = jest.mocked(supabase.from) as unknown as jest.Mock;
const NOW = Date.parse('2026-11-01T12:00:00Z');
const at = (minutes: number) => new Date(NOW + minutes * 60_000).toISOString();
const row = (over: Partial<HandoverRow> = {}): HandoverRow => ({
  id: 'h1', match_id: 'm1', from_user: 'a', to_user: 'b', initiated_by: 'a', status: 'pending', expires_at: at(10),
  created_at: at(-1), resolved_at: null, ...over,
});

/** A query builder whose every step returns itself and which resolves to `result` when awaited. */
function builder(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[][]> = {};
  const chain: Record<string, unknown> = {};
  for (const step of ['select', 'eq', 'neq', 'in', 'order', 'limit']) {
    chain[step] = (...args: unknown[]) => { (calls[step] ??= []).push(args); return chain; };
  }
  chain.maybeSingle = () => Promise.resolve(result);
  chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return { chain, calls };
}
const table = (name: string, result: { data: unknown; error: unknown }) => {
  const made = builder(result);
  from.mockImplementation((requested: string) => (requested === name ? made.chain : builder({ data: null, error: null }).chain));
  return made.calls;
};

beforeEach(() => { rpc.mockReset(); from.mockReset(); });

describe('the handover functions', () => {
  it('call each rpc with its contract arguments', async () => {
    rpc.mockResolvedValue({ data: 'new-id', error: null });
    await expect(offerHandover('m1', 'u2')).resolves.toBe('new-id');
    expect(rpc).toHaveBeenLastCalledWith('offer_scorer_handover', { p_match: 'm1', p_to: 'u2' });
    rpc.mockResolvedValue({ data: null, error: null });
    await acceptHandover('h1');
    expect(rpc).toHaveBeenLastCalledWith('accept_scorer_handover', { p_id: 'h1' });
    await declineHandover('h1');
    expect(rpc).toHaveBeenLastCalledWith('decline_scorer_handover', { p_id: 'h1' });
    await cancelHandover('h1');
    expect(rpc).toHaveBeenLastCalledWith('cancel_scorer_handover', { p_id: 'h1' });
  });

  it('throw a HandoverError with the plain message and whether the request is closed', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'ESH01', message: 'This scoring request is no longer open' } });
    const failed = await acceptHandover('h1').catch((error: unknown) => error);
    expect(failed).toBeInstanceOf(HandoverError);
    expect(failed).toMatchObject({ code: 'ESH01', closed: true, message: 'This scoring request is no longer open.' });
  });

  it('name the scorer in the "scored a moment ago" refusal', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'ESH04', message: 'x' } });
    await expect(offerHandover('m1', 'me', 'Rafi')).rejects.toMatchObject({ message: expect.stringContaining('Rafi scored a moment ago') });
  });

  it('refuse an offer that comes back without an id', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(offerHandover('m1', 'u2')).rejects.toBeInstanceOf(HandoverError);
  });
});

describe('the handover reads', () => {
  it('fetchOpenHandover returns the pending offer and ignores one past its expiry', async () => {
    const calls = table('scorer_handover', { data: [row({ id: 'stale', expires_at: at(-2) }), row()], error: null });
    await expect(fetchOpenHandover('m1', NOW)).resolves.toMatchObject({ id: 'h1', matchId: 'm1', toUser: 'b', status: 'pending' });
    expect(calls.eq).toEqual([['match_id', 'm1'], ['status', 'pending']]);
    table('scorer_handover', { data: [row({ expires_at: at(-2) })], error: null });
    await expect(fetchOpenHandover('m1', NOW)).resolves.toBeNull();
    table('scorer_handover', { data: [], error: null });
    await expect(fetchOpenHandover('m1', NOW)).resolves.toBeNull();
  });

  it('fetchIncomingHandovers asks for this account\'s pending offers and drops expired ones', async () => {
    const calls = table('scorer_handover', { data: [row({ id: 'old', expires_at: at(-1) }), row({ id: 'fresh' })], error: null });
    const list = await fetchIncomingHandovers('b', NOW);
    expect(list.map((handover) => handover.id)).toEqual(['fresh']);
    expect(calls.eq).toEqual([['to_user', 'b'], ['status', 'pending']]);
  });

  it('fetchAcceptedHandover reads the newest accepted offer', async () => {
    const calls = table('scorer_handover', { data: [row({ status: 'accepted', resolved_at: at(0) })], error: null });
    await expect(fetchAcceptedHandover('m1')).resolves.toMatchObject({ status: 'accepted', toUser: 'b' });
    expect(calls.eq).toEqual([['match_id', 'm1'], ['status', 'accepted']]);
    expect(calls.limit).toEqual([[1]]);
  });

  it('throw a read error as it is', async () => {
    table('scorer_handover', { data: null, error: { message: 'offline' } });
    await expect(fetchOpenHandover('m1', NOW)).rejects.toEqual({ message: 'offline' });
  });

  it('fetchNames asks once for the distinct ids and skips profiles without a name', async () => {
    const calls = table('profiles', { data: [{ id: 'a', full_name: 'Rafi' }, { id: 'b', full_name: null }], error: null });
    await expect(fetchNames(['a', 'b', 'a'])).resolves.toEqual({ a: 'Rafi' });
    expect(calls.in).toEqual([['id', ['a', 'b']]]);
    from.mockClear();
    await expect(fetchNames([])).resolves.toEqual({});
    expect(from).not.toHaveBeenCalled();
  });

  it('fetchTakeoverFacts falls back to the creator when no scorer is assigned', async () => {
    from.mockImplementation((name: string) => builder({
      matches: { data: { created_by: 'me', status: 'live', fixture_ref: 'friendly-1' }, error: null },
      match_scorers: { data: null, error: null },
      ball_events: { data: { created_at: at(-30) }, error: null },
    }[name] ?? { data: null, error: null }).chain);
    await expect(fetchTakeoverFacts('m1')).resolves.toEqual({
      creatorId: 'me', scorerId: 'me', status: 'live', friendly: true, lastBallAt: at(-30),
    });
  });
});

describe('takeOverScoring', () => {
  it('offers to the creator and accepts at once', async () => {
    rpc.mockResolvedValueOnce({ data: 'h9', error: null }).mockResolvedValueOnce({ data: null, error: null });
    await takeOverScoring('m1', 'me', 'Rafi');
    expect(rpc.mock.calls).toEqual([
      ['offer_scorer_handover', { p_match: 'm1', p_to: 'me' }],
      ['accept_scorer_handover', { p_id: 'h9' }],
    ]);
  });

  it('cancels its own offer when the accept is refused, so it cannot block the scorer', async () => {
    rpc.mockResolvedValueOnce({ data: 'h9', error: null })
      .mockResolvedValueOnce({ data: null, error: { code: 'ESH04', message: 'x' } })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(takeOverScoring('m1', 'me', 'Rafi')).rejects.toMatchObject({ code: 'ESH04', message: expect.stringContaining('Rafi scored a moment ago') });
    expect(rpc).toHaveBeenLastCalledWith('cancel_scorer_handover', { p_id: 'h9' });
  });

  it('does not accept when the offer itself is refused', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'ESH04', message: 'x' } });
    await expect(takeOverScoring('m1', 'me')).rejects.toMatchObject({ code: 'ESH04' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
