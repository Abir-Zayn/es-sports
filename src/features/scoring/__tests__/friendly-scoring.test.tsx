import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { useEffect, type ReactNode } from 'react';

import { careerOf, resetLedger, useLedger } from '@/features/profile/career-ledger';
import { ThemeProvider } from '@/theme';

import { normalizeOpeners } from '../components/opening-players';
import { clearStagedSetups, stageMatchSetup } from '../data/staged-setups';
import { MatchResultScreen } from '../result-screen';
import { ScorerProvider, useScorer } from '../scorer-provider';
import type { ScorerAction } from '../session-reducer';
import type { MatchSetup } from '../types';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true }),
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'user-1' } } }) }));
jest.mock('../data/match-repository', () => ({
  isUuid: (value: string) => /^[0-9a-f]{8}-/.test(value),
  findMatch: jest.fn().mockResolvedValue(null),
  fetchPlayers: jest.fn(),
  fetchEvents: jest.fn(),
  createMatch: jest.fn().mockResolvedValue(undefined),
  applyOp: jest.fn().mockResolvedValue(undefined),
  saveResult: jest.fn().mockResolvedValue(undefined),
  reopenMatch: jest.fn().mockResolvedValue(undefined),
  signedInUserId: jest.fn().mockResolvedValue('user-1'),
}));

const REF = 'friendly-test';
const MATCH = '66666666-6666-4666-8666-666666666666';
const ACCOUNT = 'acct-kings-1';
const squad = (prefix: string) => [1, 2, 3, 4].map((n) => ({ id: `${prefix}${n}`, name: `${prefix === 'a' ? 'King' : 'Striker'} ${n}`, role: 'Batter' }));
const setup: MatchSetup = {
  title: 'Friendly · Kings vs Strikers', playersPerSide: 4, preset: true, tossWinner: 'KK', decision: 'bat',
  teams: {
    KK: { team: { name: 'Kings', short: 'KI', tone: 'yellow' }, players: squad('a').map((p, i) => (i === 0 ? { ...p, profileId: ACCOUNT } : p)) },
    CS: { team: { name: 'Strikers', short: 'ST', tone: 'blue' }, players: squad('b') },
  },
  playingXi: { KK: ['a1', 'a2', 'a3', 'a4'], CS: ['b1', 'b2', 'b3', 'b4'] },
  strikerId: '', nonStrikerId: '', bowlerId: '', recordShots: true, oversLimit: 1,
};

let n = 0;
const id = () => `e${n++}`;
const runs = (r: number): ScorerAction => ({ type: 'delivery', input: { kind: 'runs', runs: r }, id: id() });
const shot = (angle: number): ScorerAction => ({ type: 'shot', angle, id: id() });
const wicket = (outId: string, nextBatterId?: string): ScorerAction =>
  ({ type: 'delivery', input: { kind: 'wicket', runs: 0, dismissal: 'Bowled', outId, nextBatterId }, id: id() });

/** Kings make 10 in their one over (a 4 through the off side, a 6 straight); Strikers are bowled out for 0. */
function playMatch(dispatch: (action: ScorerAction) => void) {
  dispatch({ type: 'setup', value: normalizeOpeners(setup, 'KK') });
  dispatch({ type: 'start', id: id() });
  [runs(4), shot(0), runs(6), shot(270), runs(0), runs(0), runs(0), runs(0)].forEach(dispatch);
  dispatch({ type: 'setup', value: normalizeOpeners({ ...setup, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'a4' }, 'CS') });
  dispatch({ type: 'start', id: id() });
  [wicket('b1', 'b3'), wicket('b3', 'b4'), wicket('b4')].forEach(dispatch);
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider><ScorerProvider matchId={REF}>{children}</ScorerProvider></ThemeProvider>
);

describe('scoring a friendly to the end', () => {
  beforeEach(() => {
    resetLedger();
    clearStagedSetups();
    stageMatchSetup(REF, MATCH, setup);
  });

  it('opens on the friendly teams and adds the finished match to linked careers once', async () => {
    const hook = await renderHook(() => ({ scorer: useScorer(), ledger: useLedger() }), { wrapper });
    await waitFor(() => expect(hook.result.current.scorer.setup.title).toBe('Friendly · Kings vs Strikers'));
    await act(() => playMatch(hook.result.current.scorer.dispatch));
    expect(hook.result.current.scorer.score?.complete).toBe(true);
    expect(hook.result.current.ledger).toHaveLength(1);
    const kings1 = careerOf(hook.result.current.ledger, ACCOUNT);
    expect(kings1.performances).toEqual([expect.objectContaining({ runs: 10, ballsFaced: 6, fours: 1, sixes: 1, isNotOut: true })]);
    expect(kings1.recent[0]).toMatchObject({ opponent: 'vs Strikers', bat: '10* (6)', won: true });

    // Undoing the last ball reopens the match and takes it back out of the careers.
    await act(() => hook.result.current.scorer.dispatch({ type: 'undo', id: id() }));
    expect(hook.result.current.ledger).toHaveLength(0);
  });

  it('shows the result, the top performers, the run zones and the career update', async () => {
    function Played() {
      const { dispatch } = useScorer();
      useEffect(() => playMatch(dispatch), [dispatch]);
      return <MatchResultScreen />;
    }
    await render(<Played />, { wrapper });
    expect(await screen.findByText('Match summary')).toBeTruthy();
    expect(screen.getAllByText('Kings won by 10 runs').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('BEST BATTER: King 1, 10* (6)')).toBeTruthy();
    expect(screen.getByLabelText('BEST BOWLER: King 4, 3/0 (0.3)')).toBeTruthy();
    expect(screen.getByLabelText('Off side: 4 runs from 1 shots, 40 percent')).toBeTruthy();
    expect(screen.getByLabelText('Straight / V: 6 runs from 1 shots, 60 percent')).toBeTruthy();
    expect(screen.getByLabelText('King 1: highest 10*, 1 matches, 0 wickets, average -')).toBeTruthy();
  });
});
