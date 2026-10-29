import type { TeamInfo } from '@/types/cricket';

export type PlayingRole = 'batter' | 'bowler' | 'all-rounder' | 'keeper';
export type BattingStyle = 'right' | 'left';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type PlayerProfile = {
  id: string;
  fullName: string;
  /** Neighbourhood or locality, e.g. "Halishahar". */
  area?: string;
  /** District, e.g. "Chattogram". */
  district?: string;
  bloodGroup?: BloodGroup;
  /** Bangladeshi mobile number, digits only, e.g. "01712345678". */
  phone?: string;
  /** National ID number, digits only (10, 13 or 17). Private: show it masked. */
  nationalId?: string;
  role: PlayingRole;
  battingStyle: BattingStyle;
  avatarUri?: string;
};

export type BattingStats = {
  matches: number;
  innings: number;
  runs: number;
  /** Best score as shown, "*" marks not out, e.g. "78*". */
  highest: string;
  average: string;
  strikeRate: string;
  fifties: number;
  hundreds: number;
};

export type BowlingStats = {
  matches: number;
  /** Overs bowled as shown, e.g. "62.4". */
  overs: string;
  wickets: number;
  /** Best figures as shown, e.g. "4/18". */
  best: string;
  economy: string;
  average: string;
  threeW: number;
  fiveW: number;
};

export type Performance = {
  id: string;
  /** Short date as shown, e.g. "22 Oct". */
  date: string;
  /** Opponent line as shown, e.g. "vs Agrabad Titans". */
  opponent: string;
  /** Batting figure, e.g. "45 (32)". Absent when the player did not bat. */
  bat?: string;
  /** Bowling figure, e.g. "2/24 (4)". Absent when the player did not bowl. */
  bowl?: string;
  won: boolean;
};

export type ProfileData = {
  profile: PlayerProfile;
  batting: BattingStats;
  bowling: BowlingStats;
  teams: TeamInfo[];
  recent: Performance[];
};

/** One player's figures from one completed match, the unit a career is built from. */
export type PlayerMatchPerformance = {
  playerId: string;
  playerName: string;
  /** False when the player was picked but never came in to bat. */
  batted: boolean;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isNotOut: boolean;
  /** Legal balls bowled. Overs as shown are derived from this. */
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  maidens: number;
};

/** The headline career figures a completed match changes, as shown on the profile. */
export type PlayerCareerStatsUpdate = {
  /** Best score, "*" marks not out, e.g. "86*" or "74". */
  highestRun: string;
  totalMatches: number;
  totalWickets: number;
  /** Career runs per dismissal, e.g. "34.0", or "-" before the first dismissal. */
  avg: string;
};
