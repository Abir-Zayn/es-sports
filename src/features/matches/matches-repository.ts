import { parseISO } from 'date-fns';

import { formatDate, getLocale, translate, type Locale } from '@/i18n';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';
import type { Fixture, FixtureSide, FixtureState } from '@/types/cricket';

export const MATCH_COLUMNS =
  'id, title, status, scheduled_at, started_at, completed_at, team_a_name, team_a_short, team_a_tone, team_a_image_url, team_a_runs, team_a_wickets, team_a_balls, team_b_name, team_b_short, team_b_tone, team_b_image_url, team_b_runs, team_b_wickets, team_b_balls, overs_limit, winner_side, result_summary, created_at';

export type RawMatchRow = {
  id: string;
  title: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  team_a_name: string;
  team_a_short: string;
  team_a_tone: string;
  team_a_image_url?: string | null;
  team_a_runs: number | null;
  team_a_wickets: number | null;
  team_a_balls: number | null;
  team_b_name: string;
  team_b_short: string;
  team_b_tone: string;
  team_b_image_url?: string | null;
  team_b_runs: number | null;
  team_b_wickets: number | null;
  team_b_balls: number | null;
  overs_limit: number;
  winner_side: string | null;
  result_summary: string | null;
  created_at: string;
};

export const formatOvers = (balls?: number | null, limit?: number | null) => {
  if (balls != null && balls >= 0) {
    const overNum = Math.floor(balls / 6);
    const rem = balls % 6;
    return rem > 0 ? `${overNum}.${rem}` : `${overNum}`;
  }
  return limit ? String(limit) : undefined;
};

export function matchRowToFixture(row: RawMatchRow, locale: Locale = getLocale()): Fixture {
  const isCompleted = row.status === 'completed';
  const isLive = row.status === 'live';
  const state: FixtureState = isLive ? 'live' : isCompleted ? 'result' : 'upcoming';

  const dateIso = (isCompleted ? row.completed_at : null) ?? row.scheduled_at ?? row.started_at ?? row.created_at;
  let date = '';
  let day = '';
  let time: string | undefined = undefined;

  try {
    const parsed = parseISO(dateIso ?? new Date().toISOString());
    date = formatDate(parsed, 'yyyy-MM-dd', 'en');
    day = formatDate(parsed, 'EEE, d MMM', locale);
    time = formatDate(parsed, 'h:mm a', locale);
  } catch {
    date = new Date().toISOString().slice(0, 10);
    day = date;
  }

  const scoreA = row.team_a_runs != null ? `${row.team_a_runs}/${row.team_a_wickets ?? 0}` : '';
  const oversA = isCompleted || isLive ? formatOvers(row.team_a_balls, row.overs_limit) : undefined;

  const scoreB = row.team_b_runs != null ? `${row.team_b_runs}/${row.team_b_wickets ?? 0}` : '';
  const oversB = isCompleted || isLive ? formatOvers(row.team_b_balls, row.overs_limit) : undefined;

  const winner = row.winner_side;
  const isWinnerA = winner === 'a';
  const isWinnerB = winner === 'b';

  const toneA = (row.team_a_tone === 'yellow' || row.team_a_tone === 'neutral' ? row.team_a_tone : 'blue') as AvatarTone;
  const toneB = (row.team_b_tone === 'blue' || row.team_b_tone === 'neutral' ? row.team_b_tone : 'yellow') as AvatarTone;

  const sideA: FixtureSide = {
    team: {
      short: row.team_a_short || 'T1',
      name: row.team_a_name || translate(locale, 'matches.team1Fallback'),
      tone: toneA,
      ...(row.team_a_image_url ? { avatarUri: row.team_a_image_url } : {}),
    },
    score: scoreA,
    overs: oversA,
    emphasised: isCompleted ? isWinnerA : true,
  };

  const sideB: FixtureSide = {
    team: {
      short: row.team_b_short || 'T2',
      name: row.team_b_name || translate(locale, 'matches.team2Fallback'),
      tone: toneB,
      ...(row.team_b_image_url ? { avatarUri: row.team_b_image_url } : {}),
    },
    score: scoreB,
    overs: oversB,
    emphasised: isCompleted ? isWinnerB : true,
  };

  const note = isCompleted
    ? (row.result_summary || (isWinnerA ? translate(locale, 'matches.teamWon', { team: row.team_a_name }) : isWinnerB ? translate(locale, 'matches.teamWon', { team: row.team_b_name }) : translate(locale, 'matches.matchTied')))
    : row.title || translate(locale, 'matches.defaultVenue');

  return {
    id: row.id,
    state,
    title: row.title ?? translate(locale, 'match.vsTitle', { teamA: row.team_a_name, teamB: row.team_b_name }),
    date,
    day,
    time: isLive ? undefined : time,
    sides: [sideA, sideB],
    note,
  };
}

/** Maps raw match rows into Fixture objects for the given locale; none when offline or empty. */
export function mapMatchRowsToFixtures(
  rows: RawMatchRow[] | null,
  status: 'scheduled' | 'completed' | 'upcoming',
  locale: Locale = getLocale(),
): Fixture[] {
  if (!rows || rows.length === 0) return [];
  return rows.map((row) => matchRowToFixture(row, locale));
}

/** Fetches raw real-time match rows from Supabase. A failed read throws, so the screen can say so and retry. */
export async function fetchMatchRows(
  status: 'scheduled' | 'completed' | 'upcoming',
  signal?: AbortSignal,
): Promise<RawMatchRow[] | null> {
  const normalizedStatus = status === 'upcoming' ? 'scheduled' : status;
  if (!supabase || typeof supabase.from !== 'function') return null;
  const orderCol = normalizedStatus === 'scheduled' ? 'scheduled_at' : 'completed_at';
  const query = supabase
    .from('matches')
    .select(MATCH_COLUMNS)
    .eq('status', normalizedStatus)
    .order(orderCol, { ascending: normalizedStatus === 'scheduled' })
    .limit(30);
  const { data, error } = signal ? await query.abortSignal(signal) : await query;
  if (error) throw error;
  return (data ?? []) as RawMatchRow[];
}

/** Reads real-time matches from Supabase; none when offline. */
export async function fetchMatches(
  status: 'scheduled' | 'completed' | 'upcoming',
  signal?: AbortSignal,
): Promise<Fixture[]> {
  const rows = await fetchMatchRows(status, signal);
  return mapMatchRowsToFixtures(rows, status, getLocale());
}
