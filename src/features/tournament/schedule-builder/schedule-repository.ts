// In-memory stand-in for the tournament's matches until the schedule is saved to Supabase. Publishing will write
// one `matches` row per fixture with `status = 'scheduled'`, which the Matches tab then lists.
import type { Schedule, ScheduledMatch, SlotSettings } from './types';

const LATENCY_MS = 200;

/** A refused save, with a message fit to show. */
export class ScheduleError extends Error {}

const schedules = new Map<string, Schedule>();
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

/** The saved schedule, or null before one is published. */
export async function fetchSchedule(tournamentId: string): Promise<Schedule | null> {
  await wait();
  return schedules.get(tournamentId) ?? null;
}

/** Publishes the schedule so teams and followers can see it. Only the tournament owner may. */
export async function publishSchedule(
  tournamentId: string,
  isOwner: boolean,
  settings: SlotSettings,
  matches: ScheduledMatch[],
): Promise<Schedule> {
  await wait();
  if (!isOwner) throw new ScheduleError('Only the tournament owner can publish the schedule.');
  if (matches.length === 0) throw new ScheduleError('Draw the schedule before publishing it.');
  const schedule = { tournamentId, settings, matches, publishedAt: new Date().toISOString() };
  schedules.set(tournamentId, schedule);
  return schedule;
}

/** Clears every schedule. Tests only. */
export function resetSchedules() {
  schedules.clear();
}
