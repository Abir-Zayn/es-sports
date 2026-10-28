import type { TeamInfo } from '@/types/cricket';

export type TeamTabId = 'overview' | 'squad' | 'members' | 'matches';

export type TeamRecord = { played: number; won: number; lost: number; position: number };

export type TeamLiveMatch = {
  id: string;
  /** e.g. "MATCH 12 · HSF PREMIER LEAGUE". */
  label: string;
  /** e.g. "vs Karnaphuli Kings". */
  versus: string;
  score: string;
  overs: string;
  status: string;
};

export type FormResult = {
  id: string;
  won: boolean;
  /** e.g. "vs AT". */
  versus: string;
  /** e.g. "M1". */
  match: string;
};

export type KeyPlayer = {
  name: string;
  label: string;
  value: string;
  unit: string;
};

export type PlayerCareerStats = {
  highestRun: string;
  totalMatches: number;
  totalWickets: number;
  avg: string;
};

export type SquadPlayer = {
  name: string;
  role: string;
  /** Badge on the avatar: "C" for captain, "WK" for keeper. */
  tag?: string;
  stats?: PlayerCareerStats;
};

export type MemberKind = 'bat' | 'ar' | 'bowl' | 'staff';

export type MemberTag = 'Captain' | 'Keeper' | 'Invited' | 'Manager' | 'Staff';

export type TeamMember = { name: string; kind: MemberKind; detail: string; tag?: MemberTag };

export type HistoryResult = 'live' | 'W' | 'L';

export type TeamMatch = {
  id: string;
  result: HistoryResult;
  /** e.g. "MATCH 11 · YESTERDAY". */
  label: string;
  opponent: TeamInfo;
  scores: string;
  outcome: string;
};

export type TeamProfile = {
  team: TeamInfo;
  /** e.g. "HSF Premier League · 1st". */
  standing: string;
  captain: string;
  location: string;
  record: TeamRecord;
  live: TeamLiveMatch | null;
  form: FormResult[];
  keyPlayers: KeyPlayer[];
  info: { label: string; value: string }[];
  squad: { forMatch: string; playingXi: SquadPlayer[]; bench: SquadPlayer[] };
  members: TeamMember[];
  matches: TeamMatch[];
};
