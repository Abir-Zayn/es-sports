// The points table of a published tournament, read from the `tournament_standings` view. The server works out
// played, won, lost, tied, points and net run rate from finished league matches; this file only orders and labels.
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';
import type { PointsRow } from '@/types/cricket';

import { toTournamentError } from './tournament-errors';

type StandingRow = {
  team_id: string | null; name: string | null; short_name: string | null; tone: string | null;
  played: number | null; won: number | null; lost: number | null; tied: number | null; points: number | null;
  nrr: number | null;
};

const tones: readonly AvatarTone[] = ['blue', 'yellow', 'neutral'];
/** 16 teams is the most a tournament can have. */
const ROW_LIMIT = 16;

export const standingsKey = (tournamentId: string) => ['tournament-standings', tournamentId] as const;

/** "+1.245", "-0.105", "0.000", or "—" before a team has played. */
export function formatNrr(nrr: number | null | undefined): string {
  if (nrr == null || !Number.isFinite(nrr)) return '—';
  const fixed = Math.abs(nrr).toFixed(3);
  if (fixed === '0.000') return '0.000';
  return `${nrr > 0 ? '+' : '-'}${fixed}`;
}

/** How many teams go through, and what that means. Null for a knockout-only tournament, which has no table. */
export function qualifyRule(competition: string, teamCount: number): { count: number; note: string } | null {
  if (competition === 'knockout') return null;
  if (competition === 'league') return { count: Math.min(1, teamCount), note: 'Champion' };
  return teamCount >= 4 ? { count: 4, note: 'Qualify for the semi-finals' } : { count: Math.min(2, teamCount), note: 'Qualify for the final' };
}

/** Points, then net run rate, then wins, then name. A team that has not played sorts after one that has, on level points. */
export function orderStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) =>
    (b.points ?? 0) - (a.points ?? 0)
    || (b.nrr ?? Number.NEGATIVE_INFINITY) - (a.nrr ?? Number.NEGATIVE_INFINITY)
    || (b.won ?? 0) - (a.won ?? 0)
    || (a.name ?? '').localeCompare(b.name ?? ''));
}

export function toPointsRow(row: StandingRow, index: number): PointsRow {
  return {
    pos: index + 1,
    team: {
      short: row.short_name ?? '--', name: row.name ?? 'Team',
      tone: tones.find((tone) => tone === row.tone) ?? 'neutral',
    },
    played: row.played ?? 0, won: row.won ?? 0, lost: row.lost ?? 0, noResult: row.tied ?? 0,
    nrr: formatNrr(row.nrr), points: row.points ?? 0,
  };
}

/** One row per entered team, in table order. */
export async function fetchStandings(tournamentId: string): Promise<PointsRow[]> {
  const { data, error } = await traceApi('tournament.standings', { tournamentId }, () => supabase.from('tournament_standings')
    .select('team_id, name, short_name, tone, played, won, lost, tied, points, nrr').eq('tournament_id', tournamentId).limit(ROW_LIMIT));
  if (error) throw toTournamentError(error);
  return orderStandings(data ?? []).map(toPointsRow);
}
