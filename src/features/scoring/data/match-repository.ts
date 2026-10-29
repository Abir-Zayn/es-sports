import { supabase } from '@/lib/supabase';

import type { PersistOp } from './event-rows';
import { FRIENDLY_REF_PREFIX } from './match-rows';
import type { BallEventRow, MatchInsert, MatchRow, PlayerRow, ResultUpdate } from './types';
import { isUuid } from './uuid';

const MATCH_COLUMNS = 'id, tournament_id, fixture_ref, created_by, title, team_a_name, team_a_short, team_a_tone, '
  + 'team_b_name, team_b_short, team_b_tone, overs_limit, status, toss_winner_side, toss_decision, record_shots, '
  + 'started_at, completed_at, result_type';
const PLAYER_COLUMNS = 'match_id, key, side, name, role, in_playing_xi, sort_order, profile_id';
const EVENT_COLUMNS = 'id, match_id, seq, innings, kind, striker_key, non_striker_key, bowler_key, delivery_kind, '
  + 'runs, total_runs, is_legal, dismissal, out_key, next_batter_key, fielder_key, angle, voided_at';
const PAGE = 500;

export { isUuid };

/**
 * Finds the match a scorer screen should open. A match id opens that match. Any other id is a fixture
 * reference: it resumes the newest match from this user that is still live, or returns null so a new
 * one starts. A friendly reference names one match only, so it opens that match finished or not.
 */
export async function findMatch(routeId: string, userId: string): Promise<MatchRow | null> {
  const query = supabase.from('matches').select(MATCH_COLUMNS);
  const { data, error } = isUuid(routeId)
    ? await query.eq('id', routeId).maybeSingle<MatchRow>()
    : await (routeId.startsWith(FRIENDLY_REF_PREFIX) ? query : query.eq('status', 'live'))
      .eq('created_by', userId).eq('fixture_ref', routeId).order('created_at', { ascending: false }).limit(1).maybeSingle<MatchRow>();
  if (error) throw error;
  return data;
}

export async function fetchPlayers(matchId: string): Promise<PlayerRow[]> {
  const { data, error } = await supabase.from('match_players').select(PLAYER_COLUMNS).eq('match_id', matchId)
    .returns<PlayerRow[]>();
  if (error) throw error;
  return data;
}

/** Every event of a match that has not been undone, in order, fetched a page at a time. */
export async function fetchEvents(matchId: string): Promise<BallEventRow[]> {
  const rows: BallEventRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from('ball_events').select(EVENT_COLUMNS)
      .eq('match_id', matchId).is('voided_at', null).order('seq').range(from, from + PAGE - 1)
      .returns<BallEventRow[]>();
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

/** Writes the match and its squads. Safe to repeat: rows that already exist are left as they are. */
export async function createMatch(match: MatchInsert, players: PlayerRow[], scorers: string[] = []): Promise<void> {
  const created = await supabase.from('matches').upsert(match, { onConflict: 'id', ignoreDuplicates: true });
  if (created.error) throw created.error;
  const squads = await supabase.from('match_players')
    .upsert(players, { onConflict: 'match_id,key', ignoreDuplicates: true });
  if (squads.error) throw squads.error;
  if (scorers.length === 0) return;
  const assigned = await supabase.from('match_scorers')
    .upsert(scorers.map((user_id) => ({ match_id: match.id, user_id })), { onConflict: 'match_id,user_id', ignoreDuplicates: true });
  if (assigned.error) throw assigned.error;
}

/** Applies one saved change. Inserts are keyed by event id, so a retry after a lost reply cannot duplicate a ball. */
export async function applyOp(matchId: string, op: PersistOp): Promise<void> {
  if (op.kind === 'insert') {
    const { error } = await supabase.from('ball_events').upsert(op.row, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  } else if (op.kind === 'angle') {
    const { data, error } = await supabase.from('ball_events').update({ angle: op.angle }).eq('id', op.id).select('id');
    if (error) throw error;
    expectChange(data, 'save the shot direction');
  } else {
    const { error } = await supabase.rpc('void_events_from', { p_match: matchId, p_event: op.fromId });
    if (error) throw error;
  }
}

/** Row level security turns a forbidden update into "0 rows changed" with no error, so check for that. */
function expectChange(rows: unknown[] | null, action: string): void {
  if (!rows || rows.length === 0) throw new Error(`You are not allowed to ${action} for this match.`);
}

export async function saveResult(matchId: string, result: ResultUpdate): Promise<void> {
  const { data, error } = await supabase.from('matches').update(result).eq('id', matchId).select('id');
  if (error) throw error;
  expectChange(data, 'save the result');
}

/** Undoing the last ball of a finished match puts it back to live and clears the result. */
export async function reopenMatch(matchId: string): Promise<void> {
  const cleared = {
    status: 'live', completed_at: null, winner_side: null, result_type: null, result_margin: null,
    result_summary: null, team_a_runs: null, team_a_wickets: null, team_a_balls: null,
    team_b_runs: null, team_b_wickets: null, team_b_balls: null,
  };
  const { data, error } = await supabase.from('matches').update(cleared).eq('id', matchId).select('id');
  if (error) throw error;
  expectChange(data, 'reopen the match');
}
