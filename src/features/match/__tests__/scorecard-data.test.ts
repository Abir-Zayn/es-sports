import { initialSetup } from '@/features/scoring/sample-data';

import { seedEvents, seedMatch, seedPlayers } from '../__fixtures__/seed-match';
import { buildLiveView, stagedLiveView } from '../live/build-live-view';
import { roleLabel } from '../live/match-details';
import { bowlerOvers, dismissalText } from '../live/scorecard-rows';

const view = buildLiveView(seedMatch, seedPlayers, seedEvents);
const [first, second] = view.innings;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe('scorecard of the seeded match', () => {
  it('has both innings with real totals', () => {
    expect(view.innings.map((i) => [i.id, i.team.short, i.score, i.summary, i.totalOvers])).toEqual([
      ['innings-1', 'HSS', '64/2', '6.0 ov · 1st innings', '(6.0 ov)'],
      ['innings-2', 'AGT', '52/4', '6.0 ov · 2nd innings', '(6.0 ov)'],
    ]);
  });

  it('writes each batter with how they were out, in batting order', () => {
    expect(first.batters.map((b) => [b.name, b.how, b.runs, b.balls, b.fours, b.sixes])).toEqual([
      ['Tanvir Ahmed', 'not out', 34, 16, 3, 2],
      ['Mahmudul Hasan', 'c Jahidul b Rakib', 21, 14, 2, 1],
      ['Shakib Chowdhury', 'b Jahidul', 4, 5, 1, 0],
      ['Kamrul Islam', 'not out', 3, 2, 0, 0],
    ]);
    expect(second.batters.map((b) => b.how)).toEqual(['not out', 'c Nayeem b Rashedul', 'b Rashedul', 'b Tanvir', 'c & b Kamrul', 'not out']);
    expect(first.yetToBat).toEqual(['Rashedul Islam', 'Nayeem Uddin', 'Farhan Kabir', 'Sohag Mia']);
  });

  it('balances: batters plus extras make the total, and so do the partnerships and the bowlers', () => {
    expect(first.extras).toBe(2);
    expect(first.extrasDetail).toBe('(wd 1, nb 1)');
    expect(second.extrasDetail).toBe('');
    for (const [inn, total] of [[first, 64], [second, 52]] as const) {
      expect(sum(inn.batters.map((b) => b.runs)) + inn.extras).toBe(total);
      expect(sum(inn.partnerships.map((p) => p.runs))).toBe(total);
      expect(sum(inn.bowlers.map((b) => b.runs))).toBe(total);
    }
  });

  it('lists the fall of wickets and the stands between them', () => {
    expect(first.fallOfWickets).toEqual([
      { score: '1-53', over: '4.4', name: 'Mahmudul' },
      { score: '2-60', over: '5.3', name: 'Shakib' },
    ]);
    expect(first.partnerships.map((p) => [p.wicket, p.pair, p.runs, p.live])).toEqual([
      ['1st', 'Tanvir & Mahmudul', 53, undefined], ['2nd', 'Tanvir & Shakib', 7, undefined], ['3rd', 'Tanvir & Kamrul', 4, undefined],
    ]);
    expect(second.fallOfWickets.map((w) => w.score)).toEqual(['1-17', '2-23', '3-43', '4-52']);
  });

  it('gives each bowler overs, maidens, runs and wickets, not counting a run out', () => {
    expect(second.bowlers.map((b) => [b.name, b.overs, b.maidens, b.runs, b.wickets])).toEqual([
      ['Rashedul Islam', '2', 0, 14, 2], ['Kamrul Islam', '2', 0, 14, 1], ['Shakib Chowdhury', '1', 0, 14, 0], ['Tanvir Ahmed', '1', 0, 10, 1],
    ]);
  });
});

describe('overs and info of the seeded match', () => {
  it('has runs per over and the overs with a wicket, for both innings', () => {
    expect(view.overs.map((o) => [o.inningsLabel, o.runsPerOver, o.wicketOvers])).toEqual([
      ['Halishahar Strikers · 1st innings', [11, 6, 17, 14, 11, 5], [5, 6]],
      ['Agrabad Tigers · 2nd innings', [8, 9, 6, 14, 10, 5], [3, 5, 6]],
    ]);
    expect(view.overs[0].overs[0]).toMatchObject({ number: 6, bowler: 'Jahidul Islam', runs: 5, score: '64/2' });
    expect(view.overs[0].overs.every((o) => !o.inProgress)).toBe(true);
  });

  it('shows the toss, the format, the result and both squads', () => {
    expect(view.info.tossNote).toEqual({ team: 'Halishahar Strikers', decision: 'won the toss and chose to bat' });
    expect(view.info.details).toEqual(expect.arrayContaining([
      { label: 'Competition', value: 'Halishahar Premier League 2026' },
      { label: 'Format', value: '6 overs per side · 8 a side' },
      { label: 'Status', value: 'Completed' },
      { label: 'Result', value: 'Halishahar Strikers won by 12 runs' },
    ]));
    expect(view.info.squads.map((s) => [s.team.name, s.playingXi.length, s.bench.length])).toEqual([
      ['Halishahar Strikers', 8, 0], ['Agrabad Tigers', 8, 0],
    ]);
    expect(view.info.squads[1].playingXi[5]).toEqual({ name: 'Jahidul Islam', role: 'Keeper' });
  });

  it('has no toss note and empty cards before the toss', () => {
    const fresh = buildLiveView({ ...seedMatch, status: 'scheduled', toss_winner_side: null, toss_decision: null, result_type: null }, seedPlayers, []);
    expect(fresh.innings).toEqual([]);
    expect(fresh.overs).toEqual([]);
    expect(fresh.info.tossNote).toBeNull();
  });

  it('shows a staged friendly with its squads and bench', () => {
    const info = stagedLiveView({ ...initialSetup, preset: true }).info;
    expect(info.tossNote?.decision).toBe('won the toss and chose to bat');
    expect(info.squads[0].playingXi).toHaveLength(11);
    expect(info.squads[0].bench.length).toBeGreaterThan(0);
  });
});

describe('scorecard wording', () => {
  it('writes every dismissal', () => {
    expect(dismissalText('Caught', 'Rakib', 'Jahid')).toBe('c Jahid b Rakib');
    expect(dismissalText('Caught', 'Rakib', 'Rakib')).toBe('c & b Rakib');
    expect(dismissalText('Stumped', 'Rakib', 'Jahid')).toBe('st Jahid b Rakib');
    expect(dismissalText('LBW', 'Rakib', null)).toBe('lbw b Rakib');
    expect(dismissalText('Run out', 'Rakib', 'Imran')).toBe('run out (Imran)');
    expect(dismissalText('Hit wicket', 'Rakib', null)).toBe('hit wicket b Rakib');
  });

  it('writes overs and roles', () => {
    expect([bowlerOvers(24), bowlerOvers(21), bowlerOvers(0)]).toEqual(['4', '3.3', '0']);
    expect([roleLabel('all-rounder'), roleLabel('keeper'), roleLabel(null), roleLabel('captain')]).toEqual(['All-rounder', 'Keeper', 'Player', 'Captain']);
  });
});
