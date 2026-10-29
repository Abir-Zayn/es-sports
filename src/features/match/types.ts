import type { AvatarTone } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

export type MatchTabId = 'live' | 'scorecard' | 'overs' | 'wagon' | 'info';

export type MatchHeader = {
  id: string;
  /** Uppercase line on the live hero, e.g. "MATCH 12 · HSF PREMIER LEAGUE". */
  label: string;
  /** Short title, e.g. "Kings vs Strikers". */
  title: string;
  /** Under the title, e.g. "Match 12 · HSF Premier League". */
  subtitle: string;
};

export type LiveSide = {
  team: TeamInfo;
  score: string;
  /** e.g. "16.3 ov · batting". */
  overs: string;
  batting: boolean;
};

export type LiveSnapshot = {
  sides: [LiveSide, LiveSide];
  /** What the chase needs, e.g. "Strikers need 27 runs from 21 balls". */
  target: string;
  currentRunRate: string;
  requiredRunRate: string;
  streamLabel: string;
  streamSource: string;
  partnership: string;
  batters: LiveBatter[];
  bowler: BowlerLine;
};

export type LiveBatter = { name: string; onStrike: boolean; runs: number; balls: number; fours: number; sixes: number };

export type BowlerLine = { name: string; overs: string; maidens: number; runs: number; wickets: number };

export type BatterLine = {
  name: string;
  /** How they were out, or "not out". */
  how: string;
  notOut: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

export type FallOfWicket = { score: string; over: string; name: string };

export type Partnership = { wicket: string; pair: string; runs: number; live?: boolean };

export type Innings = {
  id: string;
  team: TeamInfo;
  score: string;
  /** Tab subtitle, e.g. "20 ov · 1st innings". */
  summary: string;
  batters: BatterLine[];
  extras: number;
  extrasDetail: string;
  total: string;
  totalOvers: string;
  yetToBat: string[];
  fallOfWickets: FallOfWicket[];
  bowlers: BowlerLine[];
  partnerships: Partnership[];
};

export type OverSummary = {
  number: number;
  bowler: string;
  /** e.g. "to Imran & Rafi · in progress". */
  to: string;
  runs: number;
  score: string;
  /** "0".."6", "W", "Wd", "Nb", "Lb", "B", or "" for a ball not yet bowled. */
  balls: string[];
  inProgress?: boolean;
};

export type OversData = {
  inningsLabel: string;
  runsPerOver: number[];
  wicketOvers: number[];
  overs: OverSummary[];
};

/** One scoring shot: runs and its direction in degrees clockwise from the right-hand (off) side of the wheel; the left-hand side is leg. */
export type Shot = { runs: number; angle: number };

export type WagonBatter = { id: string; name: string; line: string; shots: Shot[] };

export type MatchInfoData = {
  /** Null before the toss. */
  tossNote: { team: string; decision: string } | null;
  details: { label: string; value: string }[];
  streams: { id: string; label: string; tone: 'red' | 'blue' }[];
  squads: { team: TeamInfo; playingXi: SquadPlayer[]; bench: string[] }[];
};

export type SquadPlayer = { name: string; role: string };

// ---------------------------------------------------------------------------------------------------------------
// Friendly match: two teams picked on the spot, a toss on the phone, then straight to the scorer.
// ---------------------------------------------------------------------------------------------------------------

export type TossCall = 'heads' | 'tails';
export type TossDecision = 'bat' | 'bowl';
export type FriendlySide = 'teamA' | 'teamB';

export type FriendlyTossResult = {
  /** The side whose captain called. */
  calledBy: FriendlySide;
  call: TossCall;
  /** How the coin landed. */
  landed: TossCall;
  winner: FriendlySide;
  decision: TossDecision;
  tossedAt: string;
};

/** A player in a friendly squad: an app user (`userId`) or a guest added by name and an optional phone. */
export type FriendlyPlayer = {
  id: string;
  name: string;
  role: string;
  userId: string | null;
  avatarUrl?: string | null;
  phone: string | null;
  /** False for a reserve on the bench. */
  playing: boolean;
};

export type FriendlyTeamSquad = {
  name: string;
  short: string;
  tone: AvatarTone;
  imageUri?: string;
  imageMimeType?: string;
  players: FriendlyPlayer[];
};

export type FriendlyMatchSetup = {
  id: string;
  matchType: 'friendly';
  overs: number;
  /** How many players each side fields. Squads may carry up to the squad limit, the rest on the bench. */
  playersPerSide: number;
  teamA: FriendlyTeamSquad;
  teamB: FriendlyTeamSquad;
  /** Account allowed to enter scores. The creator can always score as well. */
  assignedScorerId: string;
  toss: FriendlyTossResult | null;
  status: 'draft' | 'tossed' | 'live' | 'completed';
  createdAt: string;
};
