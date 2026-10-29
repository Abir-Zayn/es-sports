import { format } from 'date-fns';

import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';
import type { MatchSetup, TeamCode } from '@/features/scoring/types';

import type { MatchInfoData, OversData, SquadPlayer } from '../types';
import type { LiveStatus } from './live-view';
import { oversOf } from './over-rows';

/** One innings' overs for the Overs tab: runs in each over (oldest first), overs with a wicket, every over newest first. */
export function oversDataOf(
  rows: readonly BallEventRow[], innings: 1 | 2, teamName: string, nameOf: (key: string | null) => string, inningsOver: boolean,
): OversData {
  const overs = oversOf(rows, innings, nameOf, inningsOver);
  const chronological = [...overs].reverse();
  return {
    inningsLabel: `${teamName} · ${innings === 1 ? '1st' : '2nd'} innings`,
    runsPerOver: chronological.map((o) => o.runs),
    wicketOvers: chronological.filter((o) => o.balls.includes('W')).map((o) => o.number),
    overs,
  };
}

const ROLE_WORDS: Record<string, string> = { batter: 'Batter', bowler: 'Bowler', 'all-rounder': 'All-rounder', keeper: 'Keeper' };
/** "all-rounder" → "All-rounder"; anything else keeps its own words with a capital first letter. */
export const roleLabel = (role: string | null) =>
  role ? ROLE_WORDS[role.toLowerCase()] ?? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Player';

const when = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : format(date, 'EEE d MMM yyyy · h:mm a');
};

const STATUS_TEXT: Record<LiveStatus, string> = { live: 'Live', completed: 'Completed', scheduled: 'Yet to start' };

/** The Info tab of a saved match: the toss, format and timing, and both squads with the bench. */
export function matchInfoOf(match: MatchRow, players: PlayerRow[], setup: MatchSetup, status: LiveStatus, result: string | null): MatchInfoData {
  const [competition] = setup.title.split(' · ');
  const details = [
    ...(competition && competition !== setup.title ? [{ label: 'Competition', value: competition }] : []),
    { label: 'Match', value: setup.preset ? 'Friendly match' : `${setup.teams.KK.team.name} vs ${setup.teams.CS.team.name}` },
    { label: 'Format', value: `${setup.oversLimit} overs per side · ${setup.playersPerSide} a side` },
    { label: 'Status', value: STATUS_TEXT[status] },
    ...(result ? [{ label: 'Result', value: result }] : []),
    ...[['Started', when(match.started_at)], ['Finished', when(match.completed_at)]]
      .flatMap(([label, value]) => (value ? [{ label: label as string, value }] : [])),
    { label: 'Shot directions', value: setup.recordShots ? 'Recorded' : 'Not recorded' },
  ];
  const squad = (code: TeamCode) => {
    const side = code === 'KK' ? 'a' : 'b';
    const own = players.filter((p) => p.side === side).sort((x, y) => x.sort_order - y.sort_order);
    return {
      team: setup.teams[code].team,
      playingXi: own.filter((p) => p.in_playing_xi).map((p): SquadPlayer => ({ name: p.name, role: roleLabel(p.role) })),
      bench: own.filter((p) => !p.in_playing_xi).map((p) => p.name),
    };
  };
  return {
    tossNote: match.toss_winner_side
      ? { team: setup.teams[setup.tossWinner].team.name, decision: `won the toss and chose to ${setup.decision}` } : null,
    details, streams: [], squads: [squad('KK'), squad('CS')],
  };
}

/** The Info tab of a friendly tossed on this phone: the toss, the format and the squads it was set up with. */
export function stagedInfoOf(setup: MatchSetup): MatchInfoData {
  const squad = (code: TeamCode) => {
    const { team, players } = setup.teams[code];
    const playing = new Set(setup.playingXi[code]);
    return {
      team,
      playingXi: players.filter((p) => playing.has(p.id)).map((p): SquadPlayer => ({ name: p.name, role: roleLabel(p.role) })),
      bench: players.filter((p) => !playing.has(p.id)).map((p) => p.name),
    };
  };
  return {
    tossNote: { team: setup.teams[setup.tossWinner].team.name, decision: `won the toss and chose to ${setup.decision}` },
    details: [
      { label: 'Match', value: 'Friendly match' },
      { label: 'Format', value: `${setup.oversLimit} overs per side · ${setup.playersPerSide} a side` },
      { label: 'Status', value: STATUS_TEXT.scheduled },
    ],
    streams: [], squads: [squad('KK'), squad('CS')],
  };
}
