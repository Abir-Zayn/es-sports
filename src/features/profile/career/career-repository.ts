import { supabase } from '@/lib/supabase';

import { buildCareer, type Career, type FigureRow, type PlayedRow } from './career-model';

export const careerKey = (userId: string) => ['career', userId] as const;

const FIGURE_COLUMNS = 'match_id, key, completed_at, batted, runs, balls_faced, fours, sixes, not_out, balls_bowled, runs_conceded, wickets';
const PLAYED_COLUMNS =
  'match_id, side, matches!inner(status, completed_at, winner_side, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short, team_b_tone)';

type MatchEmbed = {
  completed_at: string | null; winner_side: string | null;
  team_a_name: string; team_a_short: string; team_a_tone: string; team_b_name: string; team_b_short: string; team_b_tone: string;
};

function toPlayed(row: { match_id: string; side: string; matches: MatchEmbed | MatchEmbed[] | null }): PlayedRow[] {
  const match = Array.isArray(row.matches) ? row.matches[0] : row.matches;
  if (!match) return [];
  const a = { name: match.team_a_name, short: match.team_a_short, tone: match.team_a_tone };
  const b = { name: match.team_b_name, short: match.team_b_short, tone: match.team_b_tone };
  const mine = row.side === 'a';
  return [{ match_id: row.match_id, side: row.side, completed_at: match.completed_at, winner_side: match.winner_side, own: mine ? a : b, other: mine ? b : a }];
}

const toFigure = (row: Record<string, unknown>): FigureRow[] => {
  if (typeof row.match_id !== 'string' || typeof row.key !== 'string') return [];
  const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  return [{
    match_id: row.match_id, key: row.key, completed_at: typeof row.completed_at === 'string' ? row.completed_at : null,
    batted: row.batted === true, runs: n(row.runs), balls_faced: n(row.balls_faced), fours: n(row.fours), sixes: n(row.sixes),
    not_out: row.not_out !== false, balls_bowled: n(row.balls_bowled), runs_conceded: n(row.runs_conceded), wickets: n(row.wickets),
  }];
};

/** The account's real career: every finished match it played in, read from the ball-by-ball log on the server. */
export async function fetchCareer(userId: string): Promise<Career> {
  const [figures, played] = await Promise.all([
    supabase.from('player_match_figures').select(FIGURE_COLUMNS).eq('profile_id', userId),
    supabase.from('match_players').select(PLAYED_COLUMNS).eq('profile_id', userId).eq('in_playing_xi', true)
      .eq('matches.status', 'completed'),
  ]);
  if (figures.error) throw figures.error;
  if (played.error) throw played.error;
  return buildCareer(
    (figures.data ?? []).flatMap((row) => toFigure(row as Record<string, unknown>)),
    (played.data ?? []).flatMap((row) => toPlayed(row as never)),
  );
}
