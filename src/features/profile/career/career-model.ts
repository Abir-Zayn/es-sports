import { addPerformances, emptyCareer, toBattingStats, toBowlingStats } from '@/lib/career-stats';
import type { AvatarTone } from '@/theme';
import type { TeamInfo } from '@/types/cricket';
import type { BattingStats, BowlingStats, Performance, PlayerMatchPerformance } from '@/types/profile';

/** One finished match of this player, as the server's `player_match_figures` view gives it. */
export type FigureRow = {
  match_id: string;
  key: string;
  completed_at: string | null;
  batted: boolean;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  not_out: boolean;
  balls_bowled: number;
  runs_conceded: number;
  wickets: number;
};

type SideTeam = { name: string; short: string; tone: string };
/** The team this player was in for one finished match, the other team and who won. */
export type PlayedRow = { match_id: string; side: string; completed_at: string | null; winner_side: string | null; own: SideTeam; other: SideTeam };

export type Career = {
  batting: BattingStats;
  bowling: BowlingStats;
  recent: Performance[];
  /** Teams played for in finished matches, newest first, each name once. */
  teams: TeamInfo[];
};

const RECENT_LIMIT = 5;
const tones: readonly string[] = ['blue', 'yellow', 'neutral'];
const toTone = (tone: string): AvatarTone => (tones.includes(tone) ? (tone as AvatarTone) : 'neutral');
const nameKey = (name: string) => name.trim().toLowerCase();
const oversText = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

function dateText(iso: string | null): string {
  const time = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(time) ? new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
}

const toPerformance = (row: FigureRow): PlayerMatchPerformance => ({
  playerId: row.key, playerName: '', batted: row.batted, runs: row.runs, ballsFaced: row.balls_faced, fours: row.fours,
  sixes: row.sixes, isNotOut: row.not_out, ballsBowled: row.balls_bowled, runsConceded: row.runs_conceded,
  wicketsTaken: row.wickets, maidens: 0,
});

const newestFirst = <T extends { completed_at: string | null }>(a: T, b: T) =>
  (Date.parse(b.completed_at ?? '') || 0) - (Date.parse(a.completed_at ?? '') || 0);

/** Teams from a list of matches, newest first, one per name. */
export function distinctTeams(played: readonly PlayedRow[]): TeamInfo[] {
  const seen = new Set<string>();
  const teams: TeamInfo[] = [];
  for (const row of [...played].sort(newestFirst)) {
    const key = nameKey(row.own.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    teams.push({ short: row.own.short, name: row.own.name, tone: toTone(row.own.tone) });
  }
  return teams;
}

/** Career totals, the last few matches and the teams played for, all from finished matches. Pure. */
export function buildCareer(figures: readonly FigureRow[], played: readonly PlayedRow[]): Career {
  const totals = addPerformances(emptyCareer, figures.map(toPerformance));
  const byMatch = new Map(played.map((row) => [row.match_id, row]));
  const recent = [...figures].sort(newestFirst).slice(0, RECENT_LIMIT).map((row): Performance => {
    const match = byMatch.get(row.match_id);
    return {
      id: row.match_id,
      date: dateText(row.completed_at),
      opponent: match ? `vs ${match.other.name}` : 'vs Unknown',
      bat: row.batted ? `${row.runs} (${row.balls_faced})` : undefined,
      bowl: row.balls_bowled > 0 ? `${row.wickets}/${row.runs_conceded} (${oversText(row.balls_bowled)})` : undefined,
      won: Boolean(match && match.winner_side === match.side),
    };
  });
  return { batting: toBattingStats(totals), bowling: toBowlingStats(totals), recent, teams: distinctTeams(played) };
}

/** The teams played for plus the teams the account belongs to, each name once. The count the profile shows. */
export function mergeTeams(played: readonly TeamInfo[], member: readonly TeamInfo[]): TeamInfo[] {
  const seen = new Set<string>();
  return [...played, ...member].filter((team) => {
    const key = nameKey(team.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
