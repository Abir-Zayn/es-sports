import type { TeamInfo } from '@/types/cricket';

export type TeamCode = 'KK' | 'CS';
export type ScorerPlayer = { id: string; name: string; role: string };
export type ScorerTeam = { team: TeamInfo; players: ScorerPlayer[] };
export type MatchSetup = {
  tossWinner: TeamCode;
  decision: 'bat' | 'bowl';
  playingXi: Record<TeamCode, string[]>;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  recordShots: boolean;
  oversLimit: number;
};
export type Batter = ScorerPlayer & { runs: number; balls: number; out: boolean };
export type Bowler = ScorerPlayer & { balls: number; runs: number; wickets: number };
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
  angle?: number;
};
export type OverResult = { number: number; runs: number; deliveries: Delivery[]; bowlerId: string };
export type InningsResult = { team: TeamCode; runs: number; wickets: number; balls: number };
export type ScoreState = {
  innings: 1 | 2;
  battingTeam: TeamCode;
  bowlingTeam: TeamCode;
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
  previousInnings: InningsResult | null;
};
export type ShotDraft = { deliveryId: string; runs: number; batter: string; ball: string };
export type OverlaySettings = { flashes: boolean; milestones: boolean; color: 'blue' | 'yellow' };
