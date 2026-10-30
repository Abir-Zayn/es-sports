import type { AvatarTone } from '@/theme';

import type { Dismissal } from '../types';

/** Which team of a stored match: `a` or `b`. The scorer's own codes map to these (see `sides.ts`). */
export type Side = 'a' | 'b';
export type MatchStatus = 'scheduled' | 'live' | 'completed';
export type ResultType = 'runs' | 'wickets' | 'tie';
export type DeliveryKind = 'runs' | 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'wicket';

export type MatchRow = {
  id: string;
  tournament_id: string | null;
  fixture_ref: string | null;
  created_by: string | null;
  title: string | null;
  team_a_name: string;
  team_a_short: string;
  team_a_tone: AvatarTone;
  team_a_image_url?: string | null;
  team_b_name: string;
  team_b_short: string;
  team_b_tone: AvatarTone;
  team_b_image_url?: string | null;
  overs_limit: number;
  status: MatchStatus;
  toss_winner_side: Side | null;
  toss_decision: 'bat' | 'bowl' | null;
  record_shots: boolean;
  started_at: string | null;
  completed_at: string | null;
  result_type: ResultType | null;
};

/** What the app writes when it starts a match. The database fills the rest. */
export type MatchInsert = Omit<MatchRow, 'tournament_id' | 'created_by' | 'completed_at' | 'result_type'>;

export type PlayerRow = {
  match_id: string;
  key: string;
  side: Side;
  name: string;
  role: string | null;
  in_playing_xi: boolean;
  sort_order: number;
  /** The app account this player is, or null for a guest. */
  profile_id: string | null;
};

export type EventKind = 'innings_start' | 'delivery' | 'bowler' | 'swap_ends';

export type BallEventInsert = {
  id: string;
  match_id: string;
  innings: 1 | 2;
  kind: EventKind;
  striker_key?: string | null;
  non_striker_key?: string | null;
  bowler_key?: string | null;
  delivery_kind?: DeliveryKind | null;
  runs?: number | null;
  total_runs?: number | null;
  is_legal?: boolean | null;
  dismissal?: Dismissal | null;
  out_key?: string | null;
  next_batter_key?: string | null;
  fielder_key?: string | null;
  angle?: number | null;
};

/** A stored event as read back, in `seq` order. */
export type BallEventRow = Required<BallEventInsert> & { seq: number; voided_at: string | null };

/** The final result written when the second innings ends. */
export type ResultUpdate = {
  status: 'completed';
  completed_at: string;
  team_a_runs: number;
  team_a_wickets: number;
  team_a_balls: number;
  team_b_runs: number;
  team_b_wickets: number;
  team_b_balls: number;
  winner_side: Side | null;
  result_type: ResultType;
  result_margin: number | null;
  result_summary: string;
};
