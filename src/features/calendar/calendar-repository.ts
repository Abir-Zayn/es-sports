import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

/** One of the player's games on the calendar. */
export type CalendarFixture = {
  id: string;
  /** `yyyy-MM-dd`, the day it is played. */
  date: string;
  /** Minutes after midnight. */
  startMin: number;
  home: string;
  away: string;
  tournamentId: string;
  tournamentName: string;
  stage: string;
  cancelled: boolean;
  /** Set once the match has started, so it can be opened. */
  matchId: string | null;
};

type Row = {
  id: string; match_date: string; start_min: number; stage: string; status: string; match_id: string | null;
  home_label: string | null; away_label: string | null; tournament_id: string;
  home: { name: string } | null; away: { name: string } | null; tournaments: { name: string } | null;
};

const COLUMNS = 'id, match_date, start_min, stage, status, match_id, home_label, away_label, tournament_id, '
  + 'home:teams!tournament_fixtures_home_team_id_fkey(name), away:teams!tournament_fixtures_away_team_id_fkey(name), '
  + 'tournaments!inner(name)';
// shortcut: one month of one player's teams stays far below this; page by week if a player ever plays daily in many teams.
const LIMIT = 200;

export const calendarKey = (teamIds: readonly string[], month: string) => ['calendar', month, ...teamIds] as const;

export function toCalendarFixture(row: Row): CalendarFixture {
  return {
    id: row.id, date: row.match_date, startMin: row.start_min, stage: row.stage, cancelled: row.status === 'cancelled',
    matchId: row.match_id, tournamentId: row.tournament_id, tournamentName: row.tournaments?.name ?? 'Tournament',
    home: row.home?.name ?? row.home_label ?? 'TBD', away: row.away?.name ?? row.away_label ?? 'TBD',
  };
}

/** Fixtures in `month` (`yyyy-MM`) where one of `teamIds` plays, soonest first. Deleted tournaments are left out. */
export async function fetchCalendarFixtures(teamIds: readonly string[], month: string): Promise<CalendarFixture[]> {
  if (teamIds.length === 0) return [];
  const first = startOfMonth(new Date(`${month}-01T00:00:00`));
  const ids = teamIds.join(',');
  const { data, error } = await traceApi('calendar.fixtures', { month }, () => supabase.from('tournament_fixtures').select(COLUMNS)
    .or(`home_team_id.in.(${ids}),away_team_id.in.(${ids})`)
    .gte('match_date', format(first, 'yyyy-MM-dd')).lte('match_date', format(endOfMonth(first), 'yyyy-MM-dd'))
    .is('tournaments.deleted_at', null).order('match_date').order('start_min').limit(LIMIT));
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(toCalendarFixture);
}

/** The days shown for a month, Sunday-first weeks padded with the neighbouring months' days. */
export function monthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

/** "4:30 PM" from minutes after midnight. */
export function formatStart(min: number): string {
  const safe = Math.min(Math.max(Math.round(min) || 0, 0), 1439);
  const h = Math.floor(safe / 60);
  return `${h % 12 || 12}:${String(safe % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
