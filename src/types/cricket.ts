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

export type ResultTeam = { team: TeamInfo; score: string; won: boolean };

export type MatchResult = {
  id: string;
  /** Match number and date, e.g. "MATCH 11 · YESTERDAY". */
  label: string;
  /** Outcome line, e.g. "Strikers won by 18 runs". */
  result: string;
  teams: [ResultTeam, ResultTeam];
};

export type FixtureState = 'live' | 'upcoming' | 'result';

export type FixtureSide = {
  team: TeamInfo;
  /** Runs and wickets as shown, e.g. "176/6". Empty before the side has batted. */
  score: string;
  /** Overs faced as shown, e.g. "20" or "15.2". Shown beside the score of a finished match. */
  overs?: string;
  emphasised: boolean;
};

/** One match in a tournament's schedule, whether live, still to play, or finished. */
export type Fixture = {
  id: string;
  state: FixtureState;
  /** Completion instant for ordering results played on the same day. */
  completedAt?: string;
  /** Which match it is, e.g. "Match 13" or "Semi-final 1". */
  title: string;
  /** The calendar date, "YYYY-MM-DD". Upcoming matches are grouped by its month and show its day and weekday. */
  date: string;
  /** The day as shown, e.g. "Fri, 24 Oct" or "Yesterday". Results are grouped under it. */
  day: string;
  /** Start time as shown, e.g. "4:00 PM". For matches not yet played and finished ones. */
  time?: string;
  sides: [FixtureSide, FixtureSide];
  /** Bottom line: what the game needs, who won, or the ground. */
  note: string;
};

export type PointsRow = {
  pos: number;
  team: TeamInfo;
  played: number;
  won: number;
  lost: number;
  /** Ties and abandoned matches. Played is won + lost + no result. */
  noResult: number;
  nrr: string;
  points: number;
};

export type StatMode = 'bat' | 'bowl';

export type StatLeader = {
  /** Profile id, when the player has one; opens their profile. */
  id?: string;
  rank: number;
  initials: string;
  name: string;
  team: string;
  /** The ranked figure, e.g. runs or wickets. */
  value: string;
  /** The supporting figure, e.g. strike rate or economy. */
  secondary: string;
};

/** One of the four zones a scorer taps for a scoring shot, seen from the batter facing the bowler. */
export type PitchQuadrant = 'off_side' | 'straight_v' | 'leg_side' | 'behind_square';
