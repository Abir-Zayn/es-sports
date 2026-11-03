import type { TournamentDraft } from '../create/draft';

export type ScheduleTeam = { id: string; name: string; short: string };

/** One side of a match: a known team, or a place decided by earlier results, e.g. "Winner of Match 9". */
export type SideRef = { kind: 'team'; team: ScheduleTeam } | { kind: 'tbd'; label: string };

export type StageName = 'League' | 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final';

/** Two sides and the stage they meet in, before a date is chosen. */
export type Pairing = {
  number: number;
  stage: StageName;
  /** 0 for the league; each knockout round after it counts up. A day never mixes two of these. */
  round: number;
  home: SideRef;
  away: SideRef;
};

export type LinkedMatch = {
  id: string; status: string; team_a_runs: number | null; team_a_wickets: number | null; team_a_balls: number | null;
  team_b_runs: number | null; team_b_wickets: number | null; team_b_balls: number | null; overs_limit: number;
  winner_side: string | null; result_summary: string | null; completed_at: string | null;
};

export type ScheduledMatch = Pairing & {
  id: string;
  /** "YYYY-MM-DD". */
  date: string;
  /** Minutes after midnight, e.g. 540 for 9:00 AM. */
  startMin: number;
  /** A published match the owner called off, with the reason the teams were given. Absent means scheduled. */
  cancelled?: { reason: string };
  /** Scoring has begun, so the match can no longer move or be cancelled. */
  started?: boolean;
  match?: LinkedMatch;
};

export type Competition = TournamentDraft['competition'];

/** How matches are spread over the tournament days. */
export type SlotSettings = { perDay: number; firstStartMin: number };

/** Auto: drawn from the teams and settings, then adjusted. Manual: the owner adds each match. */
export type ScheduleMode = 'auto' | 'manual';

export type Schedule = {
  tournamentId: string;
  mode: ScheduleMode;
  settings: SlotSettings;
  matches: ScheduledMatch[];
  /** When it was last published, or null while it is a draft only the organisers see. */
  publishedAt: string | null;
};
