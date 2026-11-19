import type { TeamInfo } from '@/types/cricket';

/**
 * The two sides of a scored match. The codes are slots, not team names: `KK` is always side a (team A of a
 * friendly) and `CS` side b. The real names, colours and players are in `MatchSetup.teams`.
 */
export type TeamCode = 'KK' | 'CS';
/** `profileId` links the player to an app account, so a finished match can update their career. */
export type ScorerPlayer = { id: string; name: string; role: string; profileId?: string | null };
export type ScorerTeam = { team: TeamInfo; players: ScorerPlayer[] };
export type MatchSetup = {
  /** Header line, e.g. "Friendly · Kings vs Strikers". */
  title: string;
  teams: Record<TeamCode, ScorerTeam>;
  /** How many players each side fields; the playing XI of each team has exactly this many. */
  playersPerSide: number;
  /** True when the toss and the playing sides were settled before scoring (a friendly), so setup only asks for openers. */
  preset: boolean;
  /** Accounts besides the creator allowed to score this match (stored in `match_scorers`). */
  scorerIds?: string[];
  tossWinner: TeamCode;
  decision: 'bat' | 'bowl';
  playingXi: Record<TeamCode, string[]>;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  recordShots: boolean;
  oversLimit: number;
};
export type Batter = ScorerPlayer & { runs: number; balls: number; fours: number; sixes: number; out: boolean };
export type Bowler = ScorerPlayer & { balls: number; runs: number; wickets: number; maidens: number };
export type Dismissal = 'Bowled' | 'Caught' | 'LBW' | 'Run out' | 'Stumped' | 'Caught & bowled' | 'Hit wicket';
export type DeliveryInput = {
  kind: 'runs' | 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'wicket' | 'dead';
  /** Runs off the bat, or completed extras in addition to a wide/no-ball penalty. */
  runs: number;
  dismissal?: Dismissal;
  outId?: string;
  nextBatterId?: string;
  fielderId?: string;
};
export type Delivery = DeliveryInput & {
  id: string;
  total: number;
  label: string;
  legal: boolean;
  batterId: string;
  bowlerId: string;
  ball: string;
  /** Shot direction in wagon-wheel degrees; a tapped pitch zone is stored as that zone's centre angle. */
  angle?: number;
};
export type OverResult = { number: number; runs: number; deliveries: Delivery[]; bowlerId: string };
/** A finished first innings: its total, and every player's figures for the career rollup and result card. */
export type InningsResult = {
  team: TeamCode; runs: number; wickets: number; balls: number;
  batters: Record<string, Batter>; bowlers: Record<string, Bowler>;
  /** Scoring shots with a recorded direction. */
  shots: ShotRecord[];
  /** The batters still in when the innings ended, so a not-out who never faced still counts as having batted. */
  atCrease: string[];
};
export type ShotRecord = { batterId: string; runs: number; angle: number };
export type ScoreState = {
  innings: 1 | 2;
  battingTeam: TeamCode;
  bowlingTeam: TeamCode;
  teams: Record<TeamCode, TeamInfo>;
  playingXi: Record<TeamCode, string[]>;
  batters: Record<string, Batter>;
  bowlers: Record<string, Bowler>;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  wickets: number;
  balls: number;
  oversLimit: number;
  target: number | null;
  freeHit: boolean;
  awaitingBowler: boolean;
  complete: boolean;
  currentOver: Delivery[];
  lastOver: OverResult | null;
  /** Scoring shots of this innings with a recorded direction, oldest first. */
  shots: ShotRecord[];
  previousInnings: InningsResult | null;
};
export type ShotDraft = { deliveryId: string; runs: number; batter: string; ball: string };
export type OverlaySettings = { flashes: boolean; milestones: boolean; color: 'blue' | 'yellow' };
