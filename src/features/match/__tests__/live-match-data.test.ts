import { findSpectatorMatch } from '@/features/scoring/data/match-repository';
import { clearStagedSetups, stageMatchSetup } from '@/features/scoring/data/staged-setups';
import { initialSetup } from '@/features/scoring/sample-data';
import { quadrantSplit } from '@/lib/pitch-quadrant';

import { SEED_MATCH_ID as MATCH, seedEvents as events, seedMatch as match, seedPlayers as players } from '../__fixtures__/seed-match';
import { ballKind, spokenBall } from '../components/live-ball-pill';
import { buildLiveView, stagedLiveView } from '../live/build-live-view';
import { chaseLine, nickname, padOver } from '../live/live-view';
import { ballLabel, oversOf } from '../live/over-rows';
import { loadLiveMatch, MatchNotFoundError } from '../use-live-match-data';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/scoring/data/match-repository', () => ({
  isUuid: (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
  findSpectatorMatch: jest.fn(),
  fetchPlayers: jest.fn(),
  fetchEvents: jest.fn(),
}));

describe('live view of the seeded completed match', () => {
  const view = buildLiveView(match, players, events);

  it('shows the real teams, scores and result', () => {
    expect(view.source).toBe('stored');
    expect(view.header).toMatchObject({
      title: 'Halishahar Strikers vs Agrabad Tigers', status: 'completed', label: 'HALISHAHAR PREMIER LEAGUE 2026 · 6 OVERS',
      toss: 'Halishahar Strikers won the toss and chose to bat',
    });
    expect(view.sides.map((s) => [s.team.short, s.team.tone, s.score, s.overs, s.batting])).toEqual([
      ['HSS', 'blue', '64/2', '6.0 ov', false], ['AGT', 'yellow', '52/4', '6.0 ov', false],
    ]);
    expect(view.summary).toBe('Halishahar Strikers won by 12 runs');
    expect(view.requiredRunRate).toBeNull();
  });

  it('keeps the final crease, the overs and the recorded shots', () => {
    expect(view.crease?.bowler?.name).toBeTruthy();
    expect(view.crease?.batters.map((b) => b.onStrike)).toEqual([true, false]);
    expect(view.recentOvers).toHaveLength(6);
    expect(view.recentOvers[0]).toMatchObject({ number: 6 });
    expect(view.recentOvers[0].inProgress).toBeUndefined();
    const shots = view.wagonBatters.flatMap((b) => b.shots);
    expect(shots.length).toBeGreaterThan(0);
    expect(quadrantSplit(shots).reduce((sum, z) => sum + z.percent, 0)).toBe(100);
    expect(view.wagonBatters.map((b) => b.name)).toContain('Tanvir Ahmed');
  });
});

describe('live view during the chase', () => {
  // Stop the second innings after its first two overs, with the match still live.
  const cut = events.findIndex((e) => e.id === '33333333-3333-4333-8333-000000000060');
  const view = buildLiveView({ ...match, status: 'live', result_type: null }, players, events.slice(0, cut + 3));

  it('shows the chase, the run rates and who is batting', () => {
    expect(view.header.status).toBe('live');
    expect(view.sides[1].batting).toBe(true);
    expect(view.sides[1].overs).toMatch(/ov · batting$/);
    expect(view.summary).toMatch(/^Tigers need \d+ runs in \d+ balls$/);
    expect(Number(view.requiredRunRate)).toBeGreaterThan(0);
  });

  it('shows the over in progress with the balls still to come', () => {
    const [current] = view.recentOvers;
    expect(current).toMatchObject({ number: 3, inProgress: true, balls: ['W', '6', '0', '', '', ''] });
    expect(current.to).toMatch(/in progress$/);
    expect(view.crease?.partnership).toBe('6 runs · 2 balls');
  });
});

describe('live view helpers', () => {
  it('labels deliveries and builds overs from the ball log', () => {
    expect([ballLabel({ delivery_kind: 'runs', runs: 4 }), ballLabel({ delivery_kind: 'wide', runs: 0 }), ballLabel({ delivery_kind: 'wicket', runs: 0 })])
      .toEqual(['4', 'Wd', 'W']);
    expect(oversOf([], 1, () => 'x', false)).toEqual([]);
    expect(padOver(['1', 'Wd'], 1)).toEqual(['1', 'Wd', '', '', '', '', '']);
  });

  it('writes the chase line', () => {
    expect(nickname('Halishahar Strikers')).toBe('Strikers');
    expect(chaseLine('Halishahar Strikers', 140, 127, 12)).toBe('Strikers need 13 runs in 12 balls');
    expect(chaseLine('Agrabad Tigers', 10, 9, 1)).toBe('Tigers need 1 run in 1 ball');
    expect(chaseLine('Agrabad Tigers', 10, 12, 0)).toBe('Tigers have reached the target');
  });

  it('colour-codes each ball', () => {
    expect(['4', '6', 'W', '0', '2', 'Nb', ''].map(ballKind)).toEqual(['four', 'six', 'wicket', 'dot', 'runs', 'extra', 'pending']);
    expect(['4', 'Lb', '1', '3'].map(spokenBall)).toEqual(['four', 'leg bye', '1 run', '3 runs']);
  });
});

describe('loading a match to watch', () => {
  const find = jest.mocked(findSpectatorMatch);
  beforeEach(() => {
    clearStagedSetups();
    find.mockReset();
  });

  it('shows a friendly tossed on this phone before its first ball', async () => {
    find.mockResolvedValue(null);
    stageMatchSetup('friendly-1', MATCH, { ...initialSetup, title: 'Friendly · Kings vs Strikers', preset: true, oversLimit: 8 });
    const view = await loadLiveMatch('friendly-1');
    expect(view).toEqual(stagedLiveView({ ...initialSetup, title: 'Friendly · Kings vs Strikers', preset: true, oversLimit: 8 }));
    expect(view.header).toMatchObject({ status: 'scheduled', label: 'FRIENDLY · 8 OVERS' });
    expect(view.summary).toBe('Kings bat first · 8 overs a side');
  });

  it('falls back to the sample match when the lookup fails or finds nothing', async () => {
    find.mockRejectedValue(new Error('offline'));
    expect((await loadLiveMatch('m12')).source).toBe('sample');
    find.mockResolvedValue(null);
    expect((await loadLiveMatch('unknown')).summary).toBe('Strikers need 27 runs from 21 balls');
  });

  it('never shows the sample in place of a saved match id: it fails, so the screen can say so', async () => {
    find.mockRejectedValue(new Error('offline'));
    await expect(loadLiveMatch(MATCH)).rejects.toThrow('offline');
    find.mockResolvedValue(null);
    await expect(loadLiveMatch(MATCH)).rejects.toBeInstanceOf(MatchNotFoundError);
  });
});
