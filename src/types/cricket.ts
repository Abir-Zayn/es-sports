import type { AvatarTone } from '@/theme';

export type TeamInfo = { short: string; name: string; tone: AvatarTone; avatarUri?: string };

export type LiveTeam = TeamInfo & {
  /** Display score, e.g. "142/4", or "Yet to bat". */
  score: string;
  /** Display overs, e.g. "(16.3)". Empty when there is nothing to show. */
  overs: string;
  /** True for the side currently batting. */
  batting: boolean;
};

export type LiveMatch = {
  id: string;
  /** Competition and match number, e.g. "HSF PREMIER LEAGUE Â- MATCH 12". */
  label: string;
  /** What the game needs now, e.g. "Strikers need 27 runs from 21 balls". */
  status: string;
  teams: [LiveTeam, LiveTeam];
  /** Outcome of each ball this over: "0".."6", "W", "Wd", "Nb". */
  balls: string[];
};

export type UpcomingMatch = {
  id: string;
  /** Short month, e.g. "OCT". */
  month: string;
  day: string;
  /** Short weekday, e.g. "FRI". */
  weekday: string;
  home: string;
  /** Opponent line as shown, e.g. "vs Agrabad Titans". */
  away: string;
  /** Time and ground as shown, e.g. "4:00 PM - Halishahar Ground". */
  meta: string;
};

export type StandingRow = { pos: number; team: TeamInfo; played: number; points: number; nrr: string };

export type Performer = {
  id: string;
  /** What they lead in, e.g. "MOST RUNS". */
  label: string;
  initials: string;
  name: string;
  team: string;
  value: string;
  unit: string;
};

export type ResultTeam = { team: TeamInfo; score: string; won: boolean };

export type MatchResult = {
  id: string;
  /** Match number and date, e.g. "MATCH 11 · YESTERDAY". */
  label: string;
  /** Outcome line, e.g. "Strikers won by 18 runs". */
  result: string;
  teams: [ResultTeam, ResultTeam];
};

export type TournamentOverview = {
  id: string;
  short: string;
  name: string;
  tone: AvatarTone;
  avatarUri?: string;
  /** Format, overs, team count and venue as one line. */
  meta: string;
  statusLabel: string;
  progress: string;
  live: { label: string; match: LiveMatch };
  standings: StandingRow[];
  performers: Performer[];
  results: MatchResult[];
};
