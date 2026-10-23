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
  /** Format and overs, e.g. "League + Knockout · T20". */
  format: string;
  statusLabel: string;
  progress: string;
  live: { label: string; match: LiveMatch };
  standings: StandingRow[];
  performers: Performer[];
  results: MatchResult[];
};

export type FixtureStage = 'league' | 'knockout';
export type FixtureState = 'live' | 'upcoming' | 'result';

export type FixtureSide = { team: TeamInfo; score: string; emphasised: boolean };

/** One match in a tournament's schedule, whether live, still to play, or finished. */
export type Fixture = {
  id: string;
  state: FixtureState;
  /** Match number and date, e.g. "MATCH 13 · FRI 24 OCT". */
  label: string;
  /** Start time as shown, e.g. "4:00 PM". Only for matches not yet played. */
  time?: string;
  sides: [FixtureSide, FixtureSide];
  /** Bottom line: what the game needs, who won, or the ground. */
  note: string;
};

export type FixtureGroup = { title: string; stage: FixtureStage; fixtures: Fixture[] };

export type FormResult = 'W' | 'L';

export type PointsRow = {
  pos: number;
  team: TeamInfo;
  played: number;
  won: number;
  lost: number;
  nrr: string;
  points: number;
  /** Most recent results, oldest first. */
  form: FormResult[];
};

export type BracketSide = { seed: string; name: string; tone: AvatarTone };

export type SemiFinal = { id: string; label: string; sides: [BracketSide, BracketSide] };

export type PointsTableData = {
  title: string;
  /** Progress line, e.g. "After 11 matches". */
  progress: string;
  /** How many teams from the top go through. */
  qualifyCount: number;
  qualifyNote: string;
  rules: string;
  rows: PointsRow[];
  semis: SemiFinal[];
  final: { date: string; caption: string };
};

export type StatMode = 'bat' | 'bowl';

export type StatLeader = {
  rank: number;
  initials: string;
  name: string;
  team: string;
  /** The ranked figure, e.g. runs or wickets. */
  value: string;
  /** The supporting figure, e.g. strike rate or economy. */
  secondary: string;
};

export type StatBoard = {
  /** Unit after the podium figure, e.g. "runs". */
  unit: string;
  valueHeading: string;
  secondaryHeading: string;
  categories: string[];
  /** Best first. */
  leaders: StatLeader[];
};

export type TournamentTeam = { team: TeamInfo; pos: number; captain: string; players: number; points: number };

export type HeadToHeadScope = 'all' | 'season';

export type HeadToHeadStat = { label: string; a: number; b: number };

export type HeadToHeadFigures = { played: number; winsA: number; winsB: number; stats: HeadToHeadStat[] };

export type HeadToHeadMeeting = { id: string; winner: 'a' | 'b'; result: string; meta: string };

export type HeadToHead = {
  teamA: TeamInfo;
  teamB: TeamInfo;
  figures: Record<HeadToHeadScope, HeadToHeadFigures>;
  meetings: HeadToHeadMeeting[];
};
