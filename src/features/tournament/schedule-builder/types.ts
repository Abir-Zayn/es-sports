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

export type ScheduledMatch = Pairing & {
  id: string;
  /** "YYYY-MM-DD". */
  date: string;
  /** Minutes after midnight, e.g. 540 for 9:00 AM. */
  startMin: number;
};

export type Competition = TournamentDraft['competition'];
export type MatchFormat = TournamentDraft['matchFormat'];

/** How matches are spread over the tournament days. */
export type SlotSettings = { perDay: number; firstStartMin: number };

export type Schedule = {
  tournamentId: string;
  settings: SlotSettings;
  matches: ScheduledMatch[];
  /** When it was last published, or null while it is a draft only the organisers see. */
  publishedAt: string | null;
};
