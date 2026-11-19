import { format } from 'date-fns';

import { formatOvers } from '@/features/matches/matches-repository';
import { formatDate, getLocale, translate, type Locale } from '@/i18n';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';
import type { LiveMatch, LiveTeam, UpcomingMatch } from '@/types/cricket';

import type { Tournament } from '../components/tournament-card';

const LIVE_COLUMNS =
  'id, title, toss_winner_side, toss_decision, overs_limit, team_a_name, team_a_short, team_a_tone, team_a_image_url, team_a_runs, team_a_wickets, team_a_balls, team_b_name, team_b_short, team_b_tone, team_b_image_url, team_b_runs, team_b_wickets, team_b_balls, tournaments(name)';
const UPCOMING_COLUMNS = 'id, scheduled_at, team_a_name, team_b_name, tournaments(name, venue)';
const TOURNAMENT_COLUMNS = 'id, name, city, start_date, end_date, overs, teams_planned, profile_url';

const HOME_LIMIT = 6;
const tones: readonly string[] = ['blue', 'yellow', 'neutral'];
const toTone = (value: string | null | undefined): AvatarTone => (tones.includes(value ?? '') ? (value as AvatarTone) : 'neutral');
const shortOf = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || 'T';

type Side = 'a' | 'b';
type Innings = { name: string; short: string; tone: string; image: string | null; runs: number | null; wickets: number | null; balls: number | null };
export type LiveRow = {
  id: string; title: string | null; toss_winner_side: string | null; toss_decision: string | null; overs_limit: number;
  team_a_name: string; team_a_short: string; team_a_tone: string; team_a_image_url: string | null;
  team_a_runs: number | null; team_a_wickets: number | null; team_a_balls: number | null;
  team_b_name: string; team_b_short: string; team_b_tone: string; team_b_image_url: string | null;
  team_b_runs: number | null; team_b_wickets: number | null; team_b_balls: number | null;
  tournaments: { name: string } | null;
};

const side = (row: LiveRow, s: Side): Innings => (s === 'a'
  ? { name: row.team_a_name, short: row.team_a_short, tone: row.team_a_tone, image: row.team_a_image_url, runs: row.team_a_runs, wickets: row.team_a_wickets, balls: row.team_a_balls }
  : { name: row.team_b_name, short: row.team_b_short, tone: row.team_b_tone, image: row.team_b_image_url, runs: row.team_b_runs, wickets: row.team_b_wickets, balls: row.team_b_balls });

/** Turns a live match row into the Home score card: who bats first comes from the toss, the chase line from the target. */
export function toLiveMatch(row: LiveRow, locale: Locale = getLocale()): LiveMatch {
  const tr = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) => translate(locale, key, params);
  const tossWinner: Side = row.toss_winner_side === 'b' ? 'b' : 'a';
  const firstSide: Side = row.toss_decision === 'bowl' ? (tossWinner === 'a' ? 'b' : 'a') : tossWinner;
  const first = side(row, firstSide);
  const second = side(row, firstSide === 'a' ? 'b' : 'a');
  const chasing = second.runs != null;

  const toTeam = (inn: Innings, batting: boolean): LiveTeam => ({
    short: inn.short || shortOf(inn.name), name: inn.name, tone: toTone(inn.tone), avatarUri: inn.image ?? undefined, batting,
    score: inn.runs != null ? `${inn.runs}/${inn.wickets ?? 0}` : tr('home.repo.yetToBat'),
    overs: inn.runs != null ? `(${formatOvers(inn.balls ?? 0) ?? '0'})` : '',
  });

  let status: string;
  if (chasing) {
    const need = (first.runs ?? 0) + 1 - (second.runs ?? 0);
    const ballsLeft = Math.max(0, row.overs_limit * 6 - (second.balls ?? 0));
    status = need > 0
      ? tr(need === 1 ? 'home.repo.needRun' : 'home.repo.needRuns', { team: second.name, runs: need, balls: ballsLeft })
      : tr('home.repo.reachedTarget', { team: second.name });
  } else if (first.runs != null) {
    status = tr('home.repo.battingFirst', { team: first.name });
  } else {
    status = tr(row.toss_decision === 'bowl' ? 'home.repo.tossBowl' : 'home.repo.tossBat', { team: side(row, tossWinner).name });
  }

  return {
    id: row.id,
    label: (row.tournaments?.name ?? tr('home.repo.friendlyMatch')).toUpperCase(),
    status,
    teams: [toTeam(first, !chasing), toTeam(second, chasing)],
    // shortcut: this over's balls need the ball log per match; the card hides the row until we load it.
    balls: [],
  };
}

export async function fetchLiveMatchRows(signal: AbortSignal): Promise<LiveRow[]> {
  const { data, error } = await traceApi('home.live', {}, () => supabase.from('matches').select(LIVE_COLUMNS)
    .eq('status', 'live').order('started_at', { ascending: false }).limit(HOME_LIMIT).abortSignal(signal));
  if (error) throw error;
  return (data ?? []) as LiveRow[];
}

export async function fetchLiveMatches(signal: AbortSignal): Promise<LiveMatch[]> {
  return (await fetchLiveMatchRows(signal)).map((row) => toLiveMatch(row));
}

export type UpcomingRow = { id: string; scheduled_at: string | null; team_a_name: string; team_b_name: string; tournaments: { name: string; venue: string } | null };

export function toUpcomingMatch(row: UpcomingRow, locale: Locale = getLocale()): UpcomingMatch {
  const tr = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) => translate(locale, key, params);
  let when: Date | null = null;
  try {
    when = row.scheduled_at ? new Date(row.scheduled_at) : null;
  } catch {
    when = null;
  }
  const valid = when && !Number.isNaN(when.getTime()) ? when : null;
  return {
    id: row.id,
    month: valid ? formatDate(valid, 'MMM', locale).toUpperCase() : tr('home.repo.tbd'),
    day: valid ? formatDate(valid, 'd', locale) : '',
    weekday: valid ? formatDate(valid, 'EEE', locale).toUpperCase() : tr('home.repo.datePlaceholder'),
    home: row.team_a_name,
    away: tr('home.repo.vsTeam', { team: row.team_b_name }),
    meta: [valid ? formatDate(valid, 'h:mm a', locale) : null, row.tournaments?.venue || row.tournaments?.name].filter(Boolean).join(' · '),
  };
}

/** Next scheduled matches from now on, soonest first. */
export async function fetchUpcomingFixtureRows(signal: AbortSignal): Promise<UpcomingRow[]> {
  const { data, error } = await traceApi('home.upcoming', {}, () => supabase.from('matches').select(UPCOMING_COLUMNS)
    .eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(3)
    .abortSignal(signal));
  if (error) throw error;
  return (data ?? []) as UpcomingRow[];
}

export async function fetchUpcomingFixtures(signal: AbortSignal): Promise<UpcomingMatch[]> {
  return (await fetchUpcomingFixtureRows(signal)).map((row) => toUpcomingMatch(row));
}

export type TournamentRow = { id: string; name: string; city: string; start_date: string; end_date: string; overs: number; teams_planned: number; profile_url: string | null };

export function toFollowTournament(row: TournamentRow, today: string, locale: Locale = getLocale()): Tournament {
  const tr = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) => translate(locale, key, params);
  const starts = row.start_date > today ? tr('home.repo.startsOn', { date: formatDate(row.start_date, 'd MMM', locale) }) : tr('home.repo.inProgress');
  return {
    id: row.id, short: shortOf(row.name), name: row.name, tone: 'blue', avatarUri: row.profile_url ?? undefined,
    meta: [tr('home.repo.teamsCount', { count: row.teams_planned }), `T${row.overs}`, starts].join(' · '),
  };
}

/** Open tournaments that have not finished, the ones starting soonest first. */
export async function fetchFollowTournamentRows(signal: AbortSignal): Promise<{ today: string; rows: TournamentRow[] }> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data, error } = await traceApi('home.tournaments', {}, () => supabase.from('tournaments').select(TOURNAMENT_COLUMNS)
    .is('deleted_at', null).is('closed_at', null).gte('end_date', today).order('start_date').limit(HOME_LIMIT)
    .abortSignal(signal));
  if (error) throw error;
  return { today, rows: (data ?? []) as TournamentRow[] };
}

export async function fetchFollowTournaments(signal: AbortSignal): Promise<Tournament[]> {
  const { today, rows } = await fetchFollowTournamentRows(signal);
  return rows.map((row) => toFollowTournament(row, today));
}
