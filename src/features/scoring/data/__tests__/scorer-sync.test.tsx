import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { ScorerProvider, useScorer } from '../../scorer-provider';
import type { ScorerAction } from '../../session-reducer';
import * as repository from '../match-repository';
import { buildMatchRows } from '../match-rows';
import { initialSetup } from '../../sample-data';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'user-1' } } }) }));
jest.mock('../match-repository', () => ({
  isUuid: (value: string) => /^[0-9a-f]{8}-/.test(value),
  findMatch: jest.fn().mockResolvedValue(null),
  fetchPlayers: jest.fn(),
  fetchEvents: jest.fn(),
  canScoreMatch: jest.fn().mockResolvedValue(true),
  createMatch: jest.fn().mockResolvedValue(undefined),
  startSavedMatch: jest.fn().mockResolvedValue(undefined),
  applyOp: jest.fn().mockResolvedValue(undefined),
  saveResult: jest.fn().mockResolvedValue(undefined),
  reopenMatch: jest.fn().mockResolvedValue(undefined),
}));

const repo = jest.mocked(repository);
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider><ScorerProvider matchId="m12">{children}</ScorerProvider></ThemeProvider>
);
const runs = (n: number, id: string): ScorerAction => ({ type: 'delivery', input: { kind: 'runs', runs: n }, id });

async function openScorer() {
  const hook = await renderHook(() => useScorer(), { wrapper });
  await waitFor(() => expect(hook.result.current).toBeTruthy());
  const send = (...actions: ScorerAction[]) => act(() => { actions.forEach(hook.result.current.dispatch); });
  const saved = () => waitFor(() => expect(hook.result.current.sync).toMatchObject({ status: 'idle', pending: 0 }));
  return { hook, send, saved };
}

beforeEach(() => jest.clearAllMocks());

describe('saving a scoring session', () => {
  it('starts a saved friendly before writing its first innings', async () => {
    const rows = buildMatchRows('55555555-5555-4555-8555-555555555555', 'friendly-1',
      { ...initialSetup, preset: true }, new Date());
    repo.findMatch.mockResolvedValueOnce({ ...rows.match, status: 'scheduled', started_at: null,
      tournament_id: null, created_by: 'user-1', completed_at: null, result_type: null });
    repo.fetchPlayers.mockResolvedValueOnce(rows.players);
    repo.fetchEvents.mockResolvedValueOnce([]);
    const calls: string[] = [];
    repo.startSavedMatch.mockImplementationOnce(async () => { calls.push('start match'); });
    repo.applyOp.mockImplementationOnce(async () => { calls.push('innings'); });
    const { send, saved } = await openScorer();
    await send({ type: 'start', id: 'start-saved' });
    await saved();
    expect(calls).toEqual(['start match', 'innings']);
    expect(repo.createMatch).not.toHaveBeenCalled();
  });

  it('creates the match once, then saves each ball in order, and voids an undone one', async () => {
    const calls: string[] = [];
    repo.createMatch.mockImplementation(async () => { calls.push('match'); });
    repo.applyOp.mockImplementation(async (_match, op) => { calls.push(op.kind === 'insert' ? op.row.kind : op.kind); });
    const { send, saved } = await openScorer();

    await send({ type: 'start', id: 'start' }, runs(1, 'b1'), { type: 'shot', angle: 20, id: 'sh1' }, runs(0, 'b2'), { type: 'undo', id: 'u1' });
    await saved();

    expect(calls).toEqual(['match', 'innings_start', 'delivery', 'angle', 'delivery', 'void']);
    expect(repo.createMatch).toHaveBeenCalledTimes(1);
    const [match, players] = repo.createMatch.mock.calls[0];
    expect(match).toMatchObject({ fixture_ref: 'm12', status: 'live', toss_decision: 'bat', overs_limit: 20 });
    expect(players.filter((player) => player.in_playing_xi)).toHaveLength(22);
    expect(repo.applyOp).toHaveBeenLastCalledWith(match.id, { kind: 'void', fromId: 'b2' });
  });

  it('does not save the reference match', async () => {
    const { send, saved } = await openScorer();
    await send({ type: 'demo', id: 'demo' });
    await saved();
    expect(repo.createMatch).not.toHaveBeenCalled();
    expect(repo.applyOp).not.toHaveBeenCalled();
  });

  it('saves the result when the chase ends, and clears it when that ball is undone', async () => {
    const calls: string[] = [];
    repo.applyOp.mockImplementation(async (_match, op) => { calls.push(op.kind); });
    repo.saveResult.mockImplementation(async () => { calls.push('result'); });
    repo.reopenMatch.mockImplementation(async () => { calls.push('reopen'); });
    const { hook, send, saved } = await openScorer();

    const rotation = ['CS-10', 'CS-9', 'CS-8', 'CS-7', 'CS-6'];
    const firstInnings = Array.from({ length: 20 }, (_, over): ScorerAction[] => [
      ...Array.from({ length: 6 }, (_, ball) => runs(0, `o${over}b${ball}`)),
      ...(over < 19 ? [{ type: 'bowler', playerId: rotation[(over + 1) % 5], id: `bowler-${over}` } as const] : []),
    ]).flat();
    await send({ type: 'start', id: 'start' }, ...firstInnings);
    await send({ type: 'setup', value: { ...hook.result.current.setup, strikerId: 'CS-0', nonStrikerId: 'CS-1', bowlerId: 'KK-10' } });
    await send({ type: 'start', id: 'chase' }, runs(2, 'win'));
    await saved();

    expect(repo.saveResult).toHaveBeenCalledTimes(1);
    expect(repo.saveResult.mock.calls[0][1]).toMatchObject({
      status: 'completed', winner_side: 'b', result_type: 'wickets', result_margin: 10, team_a_runs: 0, team_b_runs: 2,
    });
    expect(calls.slice(-2)).toEqual(['insert', 'result']);

    await send({ type: 'shot', id: 'win-shot' }, { type: 'undo', id: 'undo-win' });
    await saved();
    expect(calls.slice(-2)).toEqual(['void', 'reopen']);
    expect(repo.saveResult).toHaveBeenCalledTimes(1);
  });
});
