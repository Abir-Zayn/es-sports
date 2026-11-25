// A real team's match history, from the tournament fixtures it played. Friendlies keep team names only, not team
// ids, so they cannot be told apart from another team of the same name and are left out.
import { format, parseISO } from 'date-fns';

import { formatOvers } from '@/features/matches/matches-repository';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';

import type { TeamMatch, TeamRecord as HistoryRecord } from '../types';
import { toTeamError } from './team-errors';

type Side = { id: string; name: string; short_name: string; tone: string | null; logo_url: string | null } | null;
type Played = {
  id: string; status: string; team_a_name: string; team_b_name: string; winner_side: string | null; result_summary: string | null;
  team_a_runs: number | null; team_a_wickets: number | null; team_a_balls: number | null;
  team_b_runs: number | null; team_b_wickets: number | null; team_b_balls: number | null; overs_limit: number; completed_at: string | null;
};
export type HistoryRow = {
  number: number; stage: string; match_date: string; home_team_id: string | null; away_team_id: string | null;
  tournaments: { name: string } | null; home: Side; away: Side; match: Played | null;
};

export const teamHistoryKey = (teamId: string) => ['team-history', teamId] as const;
const LIMIT = 100;
const tones: readonly string[] = ['blue', 'yellow', 'neutral'];

/** This team's played and live tournament matches, newest first. */
export async function fetchTeamHistory(teamId: string): Promise<HistoryRow[]> {
  const { data, error } = await traceApi('team.history', { teamId }, () => supabase.from('tournament_fixtures')
    .select('number, stage, match_date, home_team_id, away_team_id, tournaments(name), '
      + 'home:teams!tournament_fixtures_home_team_id_fkey(id, name, short_name, tone, logo_url), '
      + 'away:teams!tournament_fixtures_away_team_id_fkey(id, name, short_name, tone, logo_url), '
      + 'match:matches!tournament_fixtures_match_id_fkey(id, status, team_a_name, team_b_name, winner_side, result_summary, '
      + 'team_a_runs, team_a_wickets, team_a_balls, team_b_runs, team_b_wickets, team_b_balls, overs_limit, completed_at)')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`).not('match_id', 'is', null)
    .order('match_date', { ascending: false }).order('number', { ascending: false }).limit(LIMIT));
  if (error) throw toTeamError(error);
  return (data ?? []) as unknown as HistoryRow[];
}

/** Rows as history cards and the record of finished ones. A tie or no result counts as played, not won or lost. */
export function toHistory(teamId: string, teamName: string, rows: HistoryRow[]): { matches: TeamMatch[]; record: HistoryRecord } {
  const matches: TeamMatch[] = [];
  for (const row of rows) {
    const m = row.match;
    if (!m || (m.status !== 'live' && m.status !== 'completed')) continue;
    const home = row.home_team_id === teamId;
    const opponent = home ? row.away : row.home;
    // Which side of the scorecard is this team: by name, else the fixture's home side is side a.
    const side: 'a' | 'b' = m.team_a_name === teamName ? 'a' : m.team_b_name === teamName ? 'b' : home ? 'a' : 'b';
    const score = (s: 'a' | 'b') => {
      const runs = s === 'a' ? m.team_a_runs : m.team_b_runs;
      if (runs == null) return 'Yet to bat';
      const wickets = (s === 'a' ? m.team_a_wickets : m.team_b_wickets) ?? 0;
      return `${runs}/${wickets} (${formatOvers(s === 'a' ? m.team_a_balls : m.team_b_balls, m.overs_limit)})`;
    };
    const result = m.status === 'live' ? 'live' : m.winner_side === side ? 'W' : m.winner_side ? 'L' : 'T';
    matches.push({
      id: m.id, result,
      label: [`MATCH ${row.number}`, row.stage === 'League' ? null : row.stage.toUpperCase(), row.tournaments?.name.toUpperCase(),
        safeDay(row.match_date)].filter(Boolean).join(' · '),
      opponent: opponent
        ? { short: opponent.short_name, name: opponent.name, tone: (tones.includes(opponent.tone ?? '') ? opponent.tone : 'neutral') as AvatarTone, avatarUri: opponent.logo_url ?? undefined }
        : { short: 'TBD', name: 'To be decided', tone: 'neutral' },
      scores: `${score(side)} · ${score(side === 'a' ? 'b' : 'a')}`,
      outcome: m.status === 'live' ? 'In progress' : m.result_summary ?? 'Match completed',
    });
  }
  const finished = matches.filter((m) => m.result !== 'live');
  return {
    matches,
    record: { played: finished.length, won: finished.filter((m) => m.result === 'W').length, lost: finished.filter((m) => m.result === 'L').length, position: 0 },
  };
}

function safeDay(date: string): string | null {
  try {
    return format(parseISO(date), 'd MMM').toUpperCase();
  } catch {
    return null;
  }
}
