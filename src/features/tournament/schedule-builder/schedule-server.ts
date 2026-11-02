// The schedule of a published tournament, in `tournament_fixtures`. Publishing replaces the whole schedule; after
// that the owner moves or cancels one match at a time, and the teams playing are notified.
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTournamentError } from '../data/tournament-errors';
import type { Schedule, ScheduledMatch, ScheduleMode, SideRef, SlotSettings, StageName } from './types';

const stages: readonly StageName[] = ['League', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
/** 16 teams in a league with knockouts is 123 matches; the server allows 200. */
const FIXTURE_LIMIT = 200;
const DEFAULT_SETTINGS: SlotSettings = { perDay: 2, firstStartMin: 9 * 60 };

type TeamRow = { id: string; name: string; short_name: string } | null;
type FixtureRow = {
  id: string; number: number; stage: string; round: number; home_label: string | null; away_label: string | null;
  match_date: string; start_min: number; status: string; cancel_reason: string | null; match_id: string | null;
  home: TeamRow; away: TeamRow;
};

function side(team: TeamRow, label: string | null): SideRef {
  if (team) return { kind: 'team', team: { id: team.id, name: team.name, short: team.short_name } };
  // A team deleted after its match was cancelled leaves neither; the old match still needs a name.
  return { kind: 'tbd', label: label ?? 'Team removed' };
}

export function toScheduledMatch(row: FixtureRow): ScheduledMatch {
  return {
    id: row.id, number: row.number, stage: stages.find((s) => s === row.stage) ?? 'League', round: row.round,
    home: side(row.home, row.home_label), away: side(row.away, row.away_label), date: row.match_date, startMin: row.start_min,
    cancelled: row.status === 'cancelled' ? { reason: row.cancel_reason ?? '' } : undefined, started: row.match_id !== null,
  };
}

/** The published schedule, or null when the owner has not published one yet. */
export async function fetchServerSchedule(tournamentId: string): Promise<Schedule | null> {
  const [settings, fixtures] = await Promise.all([
    traceApi('schedule.settings', { tournamentId }, () => supabase.from('tournaments')
      .select('schedule_mode, slots_per_day, first_start_min, schedule_published_at').eq('id', tournamentId).maybeSingle()),
    traceApi('schedule.fixtures', { tournamentId }, () => supabase.from('tournament_fixtures')
      .select('id, number, stage, round, home_label, away_label, match_date, start_min, status, cancel_reason, match_id, home:teams!tournament_fixtures_home_team_id_fkey(id, name, short_name), away:teams!tournament_fixtures_away_team_id_fkey(id, name, short_name)')
      .eq('tournament_id', tournamentId).order('match_date').order('start_min').limit(FIXTURE_LIMIT)),
  ]);
  if (settings.error) throw toTournamentError(settings.error);
  if (fixtures.error) throw toTournamentError(fixtures.error);
  const row = settings.data;
  if (!row?.schedule_published_at) return null;
  return {
    tournamentId,
    mode: row.schedule_mode === 'manual' ? 'manual' : 'auto',
    settings: { perDay: row.slots_per_day ?? DEFAULT_SETTINGS.perDay, firstStartMin: row.first_start_min ?? DEFAULT_SETTINGS.firstStartMin },
    matches: (fixtures.data ?? []).map(toScheduledMatch),
    publishedAt: row.schedule_published_at,
  };
}

const sidePayload = (prefix: 'home' | 'away', ref: SideRef) =>
  ref.kind === 'team' ? { [`${prefix}_team`]: ref.team.id } : { [`${prefix}_label`]: ref.label };

/** The body `publish_tournament_schedule` reads. Cancelled matches are left out: a new schedule starts clean. */
export function schedulePayload(mode: ScheduleMode, settings: SlotSettings, matches: ScheduledMatch[]) {
  return {
    mode, per_day: settings.perDay, first_start_min: settings.firstStartMin,
    matches: matches.filter((m) => !m.cancelled).map((m) => ({
      number: m.number, stage: m.stage, round: m.round, match_date: m.date, start_min: m.startMin,
      ...sidePayload('home', m.home), ...sidePayload('away', m.away),
    })),
  };
}

/** Replaces the schedule and returns it as the server now has it. Owner only; refused once a match has started. */
export async function publishServerSchedule(tournamentId: string, mode: ScheduleMode, settings: SlotSettings, matches: ScheduledMatch[]): Promise<Schedule> {
  const p = schedulePayload(mode, settings, matches);
  const { error } = await traceApi('schedule.publish', { tournamentId, matches: p.matches.length }, () => supabase.rpc('publish_tournament_schedule', { p_tournament: tournamentId, p }));
  if (error) throw toTournamentError(error);
  const saved = await fetchServerSchedule(tournamentId);
  if (!saved) throw toTournamentError(null);
  return saved;
}

/** Moves one published match. The teams playing are notified. */
export async function rescheduleFixture(fixtureId: string, date: string, startMin: number): Promise<void> {
  const { error } = await traceApi('schedule.move', { fixtureId, date, startMin }, () => supabase.rpc('reschedule_tournament_fixture', { p_fixture: fixtureId, p_date: date, p_start_min: startMin }));
  if (error) throw toTournamentError(error);
}

/** Cancels one published match with a reason the teams are shown. A repeat is fine. */
export async function cancelFixture(fixtureId: string, reason: string): Promise<void> {
  const { error } = await traceApi('schedule.cancel', { fixtureId }, () => supabase.rpc('cancel_tournament_fixture', { p_fixture: fixtureId, p_reason: reason.trim() }));
  if (error) throw toTournamentError(error);
}
