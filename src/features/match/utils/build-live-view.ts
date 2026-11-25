import { formatMatchResult } from '@/features/scoring/data/match-result';
import { setupFromRows } from '@/features/scoring/data/match-rows';
import { replayEvents } from '@/features/scoring/data/replay';
import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';
import { battingFirst, otherTeam, teamCodes } from '@/features/scoring/setup-defaults';
import { newSession } from '@/features/scoring/session-reducer';
import type { Batter, MatchSetup, ScoreState, TeamCode } from '@/features/scoring/types';
import { getLocale, translate, type Locale } from '@/i18n';

import type { LiveSide, WagonBatter } from '../types';
import { chaseLine, nickname, oversText, runRate, type LiveMatchViewData, type LiveStatus } from './live-view';
import { matchCardsOf } from './match-cards';
import { stagedInfoOf } from './match-details';
import { oversOf, partnershipOf } from './over-rows';

/** "Halishahar Strikers won the toss and chose to bat", or null before the toss. */
export function tossLine(setup: MatchSetup, tossed: boolean, locale: Locale = getLocale()): string | null {
  if (!tossed) return null;
  const decision = translate(locale, setup.decision === 'bat' ? 'match.toss.decisionBat' : 'match.toss.decisionBowl');
  return translate(locale, 'match.toss.wonAndChose', { team: setup.teams[setup.tossWinner].team.name, decision });
}

/** Header lines from the stored title, e.g. "League 2026 · A vs B" gives the label "LEAGUE 2026". */
export function headerOf(
  setup: MatchSetup,
  status: LiveStatus,
  toss: string | null,
  locale: Locale = getLocale(),
): LiveMatchViewData['header'] {
  const title = translate(locale, 'match.vsTitle', { teamA: setup.teams.KK.team.name, teamB: setup.teams.CS.team.name });
  const [competition] = setup.title.split(' · ');
  const label = setup.preset
    ? translate(locale, 'match.header.friendly')
    : competition && competition !== setup.title
      ? competition
      : translate(locale, 'match.header.match');
  return {
    label: translate(locale, 'match.header.label', { label, overs: setup.oversLimit }).toUpperCase(),
    title,
    subtitle: setup.title,
    status,
    toss,
  };
}

type Figures = { runs: number; wickets: number; balls: number };

function side(setup: MatchSetup, code: TeamCode, figures: Figures | null, batting: boolean, locale: Locale): LiveSide {
  const overs = figures ? oversText(figures.balls) : '';
  return {
    team: setup.teams[code].team,
    score: figures ? `${figures.runs}/${figures.wickets}` : translate(locale, 'match.yetToBat'),
    overs: figures ? translate(locale, batting ? 'match.ovBatting' : 'match.ovShort', { overs }) : '',
    batting,
  };
}

const batterLine = (b: Batter) => `${b.runs}${b.out ? '' : '*'} (${b.balls}) · ${b.fours}×4, ${b.sixes}×6`;

function wagonBattersOf(score: ScoreState, setup: MatchSetup): WagonBatter[] {
  const first = score.previousInnings;
  const team = (code: TeamCode) => ({ key: code, name: setup.teams[code].team.name, short: setup.teams[code].team.short });
  // Each innings' batters, tagged with the side they batted for, first innings first.
  const innings = [
    ...(first ? [{ code: first.team, batters: first.batters, shots: first.shots }] : []),
    { code: score.battingTeam, batters: score.batters, shots: score.shots },
  ];
  return innings.flatMap(({ code, batters, shots }) => [...new Set(shots.map((s) => s.batterId))].flatMap((id) => {
    const batter = batters[id];
    if (!batter) return [];
    return [{
      id: `${code}:${id}`, name: batter.name, line: batterLine(batter), score: `${batter.runs}${batter.out ? '' : '*'}`, team: team(code),
      shots: shots.filter((s) => s.batterId === id).map(({ runs, angle }) => ({ runs, angle })),
    }];
  }));
}

function summaryOf(setup: MatchSetup, score: ScoreState, status: LiveStatus, toss: string | null, locale: Locale): string {
  const result = formatMatchResult(score, locale);
  if (result) return result;
  if (status === 'completed') return translate(locale, 'match.matchComplete');
  const balls = score.oversLimit * 6;
  const team = (code: TeamCode) => setup.teams[code].team.name;
  if (score.innings === 2) return chaseLine(team(score.battingTeam), score.target ?? score.runs + 1, score.runs, balls - score.balls, locale);
  if (score.complete) return chaseLine(team(score.bowlingTeam), score.runs + 1, 0, balls, locale);
  return toss ?? translate(locale, 'match.battingFirstSummary', { team: nickname(team(score.battingTeam)), overs: score.oversLimit });
}

/** The spectator view of a saved match, replayed from its ball log with the scorer's own rules. */
export function buildLiveView(
  match: MatchRow,
  players: PlayerRow[],
  rows: BallEventRow[],
  locale: Locale = getLocale(),
): LiveMatchViewData {
  const setup = setupFromRows(match, players);
  const score = replayEvents({ ...newSession(), setup }, rows).score;
  const toss = tossLine(setup, match.toss_winner_side !== null, locale);
  const status: LiveStatus = match.status === 'completed' ? 'completed' : score || match.status === 'live' ? 'live' : 'scheduled';
  const header = headerOf(setup, status, toss, locale);
  const unknown = translate(locale, 'match.unknownPlayer');
  const nameOf = (key: string | null) => setup.teams.KK.players.concat(setup.teams.CS.players).find((p) => p.id === key)?.name ?? unknown;
  const result = score ? formatMatchResult(score, locale) : null;
  const cards = matchCardsOf({ match, players, rows, setup, score, status, result, nameOf, locale });
  if (!score) {
    return {
      source: 'stored', header, summary: toss ?? translate(locale, 'match.yetToStart'), currentRunRate: '0.00', requiredRunRate: null,
      sides: [side(setup, 'KK', null, false, locale), side(setup, 'CS', null, false, locale)],
      crease: null, recentOvers: [], wagonBatters: [], stream: null, ...cards,
    };
  }
  const first = score.previousInnings;
  const figuresOf = (code: TeamCode): Figures | null => (score.battingTeam === code ? score : first?.team === code ? first : null);
  const battingNow = (code: TeamCode) => status === 'live' && !score.complete && score.battingTeam === code;
  const [a, b] = teamCodes.map((code) => side(setup, code, figuresOf(code), battingNow(code), locale));
  const ballsLeft = score.oversLimit * 6 - score.balls;
  const chasing = status === 'live' && score.innings === 2 && !score.complete && ballsLeft > 0 && score.target !== null;
  const batter = (id: string, onStrike: boolean) => {
    const x = score.batters[id];
    return { name: x?.name ?? nameOf(id), onStrike, runs: x?.runs ?? 0, balls: x?.balls ?? 0, fours: x?.fours ?? 0, sixes: x?.sixes ?? 0 };
  };
  const bowler = score.bowlers[score.bowlerId];
  return {
    source: 'stored', header, sides: [a, b],
    summary: summaryOf(setup, score, status, toss, locale),
    currentRunRate: runRate(score.runs, score.balls),
    requiredRunRate: chasing ? (((score.target ?? 0) - score.runs) / ballsLeft * 6).toFixed(2) : null,
    crease: {
      batters: [batter(score.strikerId, true), batter(score.nonStrikerId, false)],
      partnership: partnershipOf(rows, score.innings, locale),
      bowler: bowler ? { name: bowler.name, overs: oversText(bowler.balls), maidens: bowler.maidens, runs: bowler.runs, wickets: bowler.wickets } : null,
    },
    recentOvers: oversOf(rows, score.innings, nameOf, score.complete || status === 'completed', locale),
    wagonBatters: wagonBattersOf(score, setup),
    stream: null,
    ...cards,
  };
}

/** A friendly tossed on this phone whose first ball has not been bowled yet. */
export function stagedLiveView(setup: MatchSetup, locale: Locale = getLocale()): LiveMatchViewData {
  const toss = tossLine(setup, true, locale);
  const batting = setup.teams[battingFirst(setup)].team.name;
  return {
    source: 'staged', header: headerOf(setup, 'scheduled', toss, locale),
    sides: [side(setup, 'KK', null, false, locale), side(setup, otherTeam('KK'), null, false, locale)],
    summary: translate(locale, 'match.batFirstSummary', { team: nickname(batting), overs: setup.oversLimit }),
    currentRunRate: '0.00', requiredRunRate: null, crease: null, recentOvers: [], wagonBatters: [], stream: null,
    innings: [], overs: [], info: stagedInfoOf(setup, locale),
  };
}
