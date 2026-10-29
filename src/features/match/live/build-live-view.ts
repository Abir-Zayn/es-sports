import { computeResult } from '@/features/scoring/data/match-result';
import { setupFromRows } from '@/features/scoring/data/match-rows';
import { replayEvents } from '@/features/scoring/data/replay';
import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';
import { battingFirst, otherTeam, teamCodes } from '@/features/scoring/sample-data';
import { newSession } from '@/features/scoring/session-reducer';
import type { Batter, MatchSetup, ScoreState, TeamCode } from '@/features/scoring/types';

import type { LiveSide, WagonBatter } from '../types';
import { chaseLine, nickname, oversText, runRate, type LiveMatchViewData, type LiveStatus } from './live-view';
import { oversOf, partnershipOf } from './over-rows';

/** "Halishahar Strikers won the toss and chose to bat", or null before the toss. */
export function tossLine(setup: MatchSetup, tossed: boolean): string | null {
  return tossed ? `${setup.teams[setup.tossWinner].team.name} won the toss and chose to ${setup.decision}` : null;
}

/** Header lines from the stored title, e.g. "League 2026 · A vs B" gives the label "LEAGUE 2026". */
export function headerOf(setup: MatchSetup, status: LiveStatus, toss: string | null): LiveMatchViewData['header'] {
  const title = `${setup.teams.KK.team.name} vs ${setup.teams.CS.team.name}`;
  const [competition] = setup.title.split(' · ');
  const label = setup.preset ? 'FRIENDLY' : competition && competition !== setup.title ? competition : 'MATCH';
  return { label: `${label} · ${setup.oversLimit} OVERS`.toUpperCase(), title, subtitle: setup.title, status, toss };
}

type Figures = { runs: number; wickets: number; balls: number };

function side(setup: MatchSetup, code: TeamCode, figures: Figures | null, batting: boolean): LiveSide {
  return {
    team: setup.teams[code].team,
    score: figures ? `${figures.runs}/${figures.wickets}` : 'Yet to bat',
    overs: figures ? `${oversText(figures.balls)} ov${batting ? ' · batting' : ''}` : '',
    batting,
  };
}

const batterLine = (b: Batter) => `${b.runs}${b.out ? '' : '*'} (${b.balls}) · ${b.fours}×4, ${b.sixes}×6`;

function wagonBattersOf(score: ScoreState): WagonBatter[] {
  const first = score.previousInnings;
  const shots = [...(first?.shots ?? []), ...score.shots];
  const lookup = (id: string) => score.batters[id] ?? first?.batters[id];
  const order = [...new Set(shots.map((s) => s.batterId))];
  return order.flatMap((id) => {
    const batter = lookup(id);
    if (!batter) return [];
    return [{ id, name: batter.name, line: batterLine(batter), shots: shots.filter((s) => s.batterId === id).map(({ runs, angle }) => ({ runs, angle })) }];
  });
}

function summaryOf(setup: MatchSetup, score: ScoreState, status: LiveStatus, toss: string | null): string {
  const result = computeResult(score);
  if (result) return result.result_summary;
  if (status === 'completed') return 'Match complete';
  const balls = score.oversLimit * 6;
  const team = (code: TeamCode) => setup.teams[code].team.name;
  if (score.innings === 2) return chaseLine(team(score.battingTeam), score.target ?? score.runs + 1, score.runs, balls - score.balls);
  if (score.complete) return chaseLine(team(score.bowlingTeam), score.runs + 1, 0, balls);
  return toss ?? `${nickname(team(score.battingTeam))} batting first · ${score.oversLimit} overs a side`;
}

/** The spectator view of a saved match, replayed from its ball log with the scorer's own rules. */
export function buildLiveView(match: MatchRow, players: PlayerRow[], rows: BallEventRow[]): LiveMatchViewData {
  const setup = setupFromRows(match, players);
  const score = replayEvents({ ...newSession(), setup }, rows).score;
  const toss = tossLine(setup, match.toss_winner_side !== null);
  const status: LiveStatus = match.status === 'completed' ? 'completed' : score || match.status === 'live' ? 'live' : 'scheduled';
  const header = headerOf(setup, status, toss);
  if (!score) {
    return {
      source: 'stored', header, summary: toss ?? 'Yet to start', currentRunRate: '0.00', requiredRunRate: null,
      sides: [side(setup, 'KK', null, false), side(setup, 'CS', null, false)],
      crease: null, recentOvers: [], wagonBatters: [], stream: null,
    };
  }
  const first = score.previousInnings;
  const figuresOf = (code: TeamCode): Figures | null => (score.battingTeam === code ? score : first?.team === code ? first : null);
  const battingNow = (code: TeamCode) => status === 'live' && !score.complete && score.battingTeam === code;
  const [a, b] = teamCodes.map((code) => side(setup, code, figuresOf(code), battingNow(code)));
  const ballsLeft = score.oversLimit * 6 - score.balls;
  const chasing = status === 'live' && score.innings === 2 && !score.complete && ballsLeft > 0 && score.target !== null;
  const nameOf = (key: string | null) => setup.teams.KK.players.concat(setup.teams.CS.players).find((p) => p.id === key)?.name ?? 'Unknown';
  const batter = (id: string, onStrike: boolean) => {
    const x = score.batters[id];
    return { name: x?.name ?? nameOf(id), onStrike, runs: x?.runs ?? 0, balls: x?.balls ?? 0, fours: x?.fours ?? 0, sixes: x?.sixes ?? 0 };
  };
  const bowler = score.bowlers[score.bowlerId];
  return {
    source: 'stored', header, sides: [a, b],
    summary: summaryOf(setup, score, status, toss),
    currentRunRate: runRate(score.runs, score.balls),
    requiredRunRate: chasing ? (((score.target ?? 0) - score.runs) / ballsLeft * 6).toFixed(2) : null,
    crease: {
      batters: [batter(score.strikerId, true), batter(score.nonStrikerId, false)],
      partnership: partnershipOf(rows, score.innings),
      bowler: bowler ? { name: bowler.name, overs: oversText(bowler.balls), maidens: bowler.maidens, runs: bowler.runs, wickets: bowler.wickets } : null,
    },
    recentOvers: oversOf(rows, score.innings, nameOf, score.complete || status === 'completed'),
    wagonBatters: wagonBattersOf(score),
    stream: null,
  };
}

/** A friendly tossed on this phone whose first ball has not been bowled yet. */
export function stagedLiveView(setup: MatchSetup): LiveMatchViewData {
  const toss = tossLine(setup, true);
  const batting = setup.teams[battingFirst(setup)].team.name;
  return {
    source: 'staged', header: headerOf(setup, 'scheduled', toss),
    sides: [side(setup, 'KK', null, false), side(setup, otherTeam('KK'), null, false)],
    summary: `${nickname(batting)} bat first · ${setup.oversLimit} overs a side`,
    currentRunRate: '0.00', requiredRunRate: null, crease: null, recentOvers: [], wagonBatters: [], stream: null,
  };
}
