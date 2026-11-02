import { format, parseISO } from 'date-fns';

import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';
import type { Fixture, FixtureSide, FixtureState } from '@/types/cricket';

import { sampleCompletedMatches } from './sample-completed';
import { sampleUpcomingMatches } from './sample-upcoming';

export const MATCH_COLUMNS =
  'id, title, status, scheduled_at, started_at, completed_at, team_a_name, team_a_short, team_a_tone, team_a_runs, team_a_wickets, team_a_balls, team_b_name, team_b_short, team_b_tone, team_b_runs, team_b_wickets, team_b_balls, overs_limit, winner_side, result_summary, created_at';

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
  team_a_runs: number | null;
  team_a_wickets: number | null;
  team_a_balls: number | null;
  team_b_name: string;
  team_b_short: string;
  team_b_tone: string;
  team_b_runs: number | null;
  team_b_wickets: number | null;
  team_b_balls: number | null;
  overs_limit: number;
  winner_side: string | null;
  result_summary: string | null;
  created_at: string;
};

const formatOvers = (balls?: number | null, limit?: number | null) => {
  if (balls != null && balls > 0) {
    const overNum = Math.floor(balls / 6);
    const rem = balls % 6;
    return rem > 0 ? `${overNum}.${rem}` : `${overNum}`;
  }
  return limit ? String(limit) : undefined;
};

export function matchRowToFixture(row: RawMatchRow): Fixture {
  const isCompleted = row.status === 'completed';
  const isLive = row.status === 'live';
  const state: FixtureState = isLive ? 'live' : isCompleted ? 'result' : 'upcoming';

  const dateIso = (isCompleted ? row.completed_at : null) ?? row.scheduled_at ?? row.started_at ?? row.created_at;
  let date = '';
  let day = '';
  let time: string | undefined = undefined;

  try {
    const parsed = parseISO(dateIso ?? new Date().toISOString());
    date = format(parsed, 'yyyy-MM-dd');
    day = format(parsed, 'EEE, d MMM');
    time = format(parsed, 'h:mm a');
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
    team: { short: row.team_a_short || 'T1', name: row.team_a_name || 'Team 1', tone: toneA },
    score: scoreA,
    overs: oversA,
    emphasised: isCompleted ? isWinnerA : true,
  };

  const sideB: FixtureSide = {
    team: { short: row.team_b_short || 'T2', name: row.team_b_name || 'Team 2', tone: toneB },
    score: scoreB,
    overs: oversB,
    emphasised: isCompleted ? isWinnerB : true,
  };

  const note = isCompleted
    ? (row.result_summary || (isWinnerA ? `${row.team_a_name} won` : isWinnerB ? `${row.team_b_name} won` : 'Match tied'))
    : row.title || 'Halishahar Ground';

  return {
    id: row.id,
    state,
    title: row.title ?? `${row.team_a_name} vs ${row.team_b_name}`,
    date,
    day,
    time: isLive ? undefined : time,
    sides: [sideA, sideB],
    note,
  };
}

function fallbackMatches(status: 'scheduled' | 'completed' | 'upcoming'): Fixture[] {
  if (status === 'scheduled' || (status as string) === 'upcoming') {
    return sampleUpcomingMatches
      .filter((fixture) => fixture.state === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return sampleCompletedMatches
    .filter((fixture) => fixture.state === 'result')
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Reads real-time matches from Supabase; falls back to sample data when offline. */
export async function fetchMatches(
  status: 'scheduled' | 'completed' | 'upcoming',
  signal?: AbortSignal,
): Promise<Fixture[]> {
  const normalizedStatus = status === 'upcoming' ? 'scheduled' : status;
  try {
    if (!supabase || typeof supabase.from !== 'function') {
      return fallbackMatches(normalizedStatus);
    }
    const orderCol = normalizedStatus === 'scheduled' ? 'scheduled_at' : 'completed_at';
    const ascending = normalizedStatus === 'scheduled';
    const query = supabase
      .from('matches')
      .select(MATCH_COLUMNS)
      .eq('status', normalizedStatus)
      .order(orderCol, { ascending })
      .limit(30);

    const { data, error } = signal ? await query.abortSignal(signal) : await query;
    if (error || !data || data.length === 0) {
      return fallbackMatches(normalizedStatus);
    }

    return (data as RawMatchRow[]).map(matchRowToFixture);
  } catch {
    return fallbackMatches(normalizedStatus);
  }
}
