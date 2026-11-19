import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';
import type { MatchSetup, TeamCode } from '@/features/scoring/types';
import { formatDate, getLocale, translate, type Locale } from '@/i18n';

import type { MatchInfoData, OversData, SquadPlayer } from '../types';
import type { LiveStatus } from './live-view';
import { oversOf } from './over-rows';

/** One innings' overs for the Overs tab: runs in each over (oldest first), overs with a wicket, every over newest first. */
export function oversDataOf(
  rows: readonly BallEventRow[],
  innings: 1 | 2,
  teamName: string,
  nameOf: (key: string | null) => string,
  inningsOver: boolean,
  locale: Locale = getLocale(),
): OversData {
  const overs = oversOf(rows, innings, nameOf, inningsOver, locale);
  const chronological = [...overs].reverse();
  return {
    inningsLabel: translate(locale, innings === 1 ? 'match.scorecard.innings1Label' : 'match.scorecard.innings2Label', { team: teamName }),
    runsPerOver: chronological.map((o) => o.runs),
    wicketOvers: chronological.filter((o) => o.balls.includes('W')).map((o) => o.number),
    overs,
  };
}

const ROLE_KEYS = {
  batter: 'match.role.batter',
  bowler: 'match.role.bowler',
  'all-rounder': 'match.role.allRounder',
  keeper: 'match.role.keeper',
} as const;

/** "all-rounder" → "All-rounder" (or Bangla equivalent); anything else keeps its own words with a capital first letter. */
export const roleLabel = (role: string | null, locale: Locale = getLocale()) => {
  if (!role) return translate(locale, 'match.role.player');
  const key = ROLE_KEYS[role.toLowerCase() as keyof typeof ROLE_KEYS];
  if (key) return translate(locale, key);
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
};

const when = (iso: string | null, locale: Locale) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : formatDate(date, 'EEE d MMM yyyy · h:mm a', locale);
};

const STATUS_KEYS: Record<LiveStatus, 'match.status.live' | 'match.status.completed' | 'match.status.scheduled'> = {
  live: 'match.status.live',
  completed: 'match.status.completed',
  scheduled: 'match.status.scheduled',
};

const decisionClause = (decision: MatchSetup['decision'], locale: Locale) =>
  translate(locale, 'match.toss.decisionClause', {
    decision: translate(locale, decision === 'bat' ? 'match.toss.decisionBat' : 'match.toss.decisionBowl'),
  });

/** The Info tab of a saved match: the toss, format and timing, and both squads with the bench. */
export function matchInfoOf(
  match: MatchRow,
  players: PlayerRow[],
  setup: MatchSetup,
  status: LiveStatus,
  result: string | null,
  locale: Locale = getLocale(),
): MatchInfoData {
  const [competition] = setup.title.split(' · ');
  const vsTitle = translate(locale, 'match.vsTitle', { teamA: setup.teams.KK.team.name, teamB: setup.teams.CS.team.name });
  const details = [
    ...(competition && competition !== setup.title ? [{ label: translate(locale, 'match.info.competition'), value: competition }] : []),
    { label: translate(locale, 'match.info.match'), value: setup.preset ? translate(locale, 'match.info.friendlyMatch') : vsTitle },
    { label: translate(locale, 'match.info.format'), value: translate(locale, 'match.info.formatValue', { overs: setup.oversLimit, players: setup.playersPerSide }) },
    { label: translate(locale, 'match.info.status'), value: translate(locale, STATUS_KEYS[status]) },
    ...(result ? [{ label: translate(locale, 'match.info.result'), value: result }] : []),
    ...[[translate(locale, 'match.info.started'), when(match.started_at, locale)], [translate(locale, 'match.info.finished'), when(match.completed_at, locale)]]
      .flatMap(([label, value]) => (value ? [{ label: label as string, value }] : [])),
    { label: translate(locale, 'match.info.shotDirections'), value: translate(locale, setup.recordShots ? 'match.info.recorded' : 'match.info.notRecorded') },
  ];
  const squad = (code: TeamCode) => {
    const side = code === 'KK' ? 'a' : 'b';
    const own = players.filter((p) => p.side === side).sort((x, y) => x.sort_order - y.sort_order);
    return {
      team: setup.teams[code].team,
      playingXi: own.filter((p) => p.in_playing_xi).map((p): SquadPlayer => ({ name: p.name, role: roleLabel(p.role, locale) })),
      bench: own.filter((p) => !p.in_playing_xi).map((p) => p.name),
    };
  };
  return {
    tossNote: match.toss_winner_side
      ? { team: setup.teams[setup.tossWinner].team.name, decision: decisionClause(setup.decision, locale) } : null,
    details, streams: [], squads: [squad('KK'), squad('CS')],
  };
}

/** The Info tab of a friendly tossed on this phone: the toss, the format and the squads it was set up with. */
export function stagedInfoOf(setup: MatchSetup, locale: Locale = getLocale()): MatchInfoData {
  const squad = (code: TeamCode) => {
    const { team, players } = setup.teams[code];
    const playing = new Set(setup.playingXi[code]);
    return {
      team,
      playingXi: players.filter((p) => playing.has(p.id)).map((p): SquadPlayer => ({ name: p.name, role: roleLabel(p.role, locale) })),
      bench: players.filter((p) => !playing.has(p.id)).map((p) => p.name),
    };
  };
  return {
    tossNote: { team: setup.teams[setup.tossWinner].team.name, decision: decisionClause(setup.decision, locale) },
    details: [
      { label: translate(locale, 'match.info.match'), value: translate(locale, 'match.info.friendlyMatch') },
      { label: translate(locale, 'match.info.format'), value: translate(locale, 'match.info.formatValue', { overs: setup.oversLimit, players: setup.playersPerSide }) },
      { label: translate(locale, 'match.info.status'), value: translate(locale, STATUS_KEYS.scheduled) },
    ],
    streams: [], squads: [squad('KK'), squad('CS')],
  };
}
